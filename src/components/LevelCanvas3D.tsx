import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import {
  LevelConfig,
  PlayerAvatar,
  PlayerEconomy,
  TrashItem,
  BinTarget,
  DragonPet,
  TimeGrenade,
} from '../types/game';
import { TRASH_META } from './LevelCanvas';
import { soundEngine } from '../utils/audio';
import {
  Droplets,
  Sparkles,
  Zap,
  Timer,
  AlertTriangle,
  Award,
  Flame,
  Volume2,
  Magnet,
  Shield,
  Crosshair,
} from 'lucide-react';

interface LevelCanvas3DProps {
  level: LevelConfig;
  avatar: PlayerAvatar;
  economy: PlayerEconomy;
  dragon: DragonPet;
  onWinLevel: (scoreGained: number, coinsNormal: number, coinsSuprema: number, coinsImposible: number, gems: number) => void;
  onLoseLevel: (reason: string) => void;
  onUpdateTrashRecycled: () => void;
  onUpdateTreesPlanted: () => void;
  onTriggerNPC: () => void;
  activeKeys: Set<string>;
  superpowerActive: boolean;
}

export const LevelCanvas3D: React.FC<LevelCanvas3DProps> = ({
  level,
  avatar,
  economy,
  dragon,
  onWinLevel,
  onLoseLevel,
  onUpdateTrashRecycled,
  onUpdateTreesPlanted,
  onTriggerNPC,
  activeKeys,
  superpowerActive,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);

  // Gameplay state
  const [timeLeft, setTimeLeft] = useState(level.durationSeconds);
  const [pollutionBar, setPollutionBar] = useState(30);
  const [trashCleanedCount, setTrashCleanedCount] = useState(0);
  const [waterAmmo, setWaterAmmo] = useState(100);
  const [statusMessage, setStatusMessage] = useState<string>(
    '¡Controla al BUCEADOR con WASD/Flechas! [ESPACIO] Dispara torpedos para abatir al villano, [E] Recoger / Imán.'
  );

  // Time Grenade notification
  const [timeFlash, setTimeFlash] = useState<{ text: string; color: string } | null>(null);

  // Villain State
  const [villainHp, setVillainHp] = useState(level.villainInfo.hp);
  const [villainDefeated, setVillainDefeated] = useState(false);
  const [proximityAlert, setProximityAlert] = useState(false);
  const [villainDistance, setVillainDistance] = useState(99);

  // Magnet Carrying State (can carry multiple items of same type!)
  const maxStack = Math.min(5, 1 + Math.floor(level.number / 2));
  const [carriedItems, setCarriedItems] = useState<TrashItem[]>([]);

  // Special Level states
  const [airButtonsFound, setAirButtonsFound] = useState(0);
  const [friendlyMonstersCount, setFriendlyMonstersCount] = useState(0);
  const [treesPlantedInLevel, setTreesPlantedInLevel] = useState(0);
  const [toxicBarrelsDefused, setToxicBarrelsDefused] = useState(0);
  const [dragonEggRescued, setDragonEggRescued] = useState(false);
  const [dinoNestsProtected, setDinoNestsProtected] = useState(0);

  // Refs for animation loop & Three.js instances
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  // 3D Objects refs
  const diverGroupRef = useRef<THREE.Group | null>(null);
  const villainMeshRef = useRef<THREE.Group | null>(null);
  const trashMeshesRef = useRef<Map<string, THREE.Group>>(new Map());
  const binsMeshesRef = useRef<Map<string, THREE.Group>>(new Map());
  const grenadesMeshesRef = useRef<Map<string, THREE.Group>>(new Map());
  const torpedoesRef = useRef<{ mesh: THREE.Mesh; dir: THREE.Vector3; life: number }[]>([]);
  const bubbleParticlesRef = useRef<{ mesh: THREE.Mesh; vy: number }[]>([]);

  // Logic data refs
  const diverPos = useRef<THREE.Vector3>(new THREE.Vector3(0, 1.2, 0));
  const diverRotation = useRef<number>(0);
  const villainPos = useRef<THREE.Vector3>(new THREE.Vector3(0, 1.5, -28));
  const villainVel = useRef<THREE.Vector3>(new THREE.Vector3(0.08, 0, 0.05));
  const trashDataRef = useRef<TrashItem[]>([]);
  const grenadesDataRef = useRef<TimeGrenade[]>([]);
  const airButtons3DRef = useRef<{ pos: THREE.Vector3; activated: boolean; mesh?: THREE.Group }[]>([]);
  const soilSpots3DRef = useRef<{ pos: THREE.Vector3; planted: boolean; mesh?: THREE.Group }[]>([]);
  const barrels3DRef = useRef<{ pos: THREE.Vector3; defused: boolean; mesh?: THREE.Group }[]>([]);
  const nests3DRef = useRef<{ pos: THREE.Vector3; protected: boolean; mesh?: THREE.Group }[]>([]);
  const egg3DRef = useRef<{ pos: THREE.Vector3; mesh?: THREE.Group } | null>(null);

  // 50% LARGER BINS
  const binsDataRef = useRef<BinTarget[]>([]);

  // Initial setup for level
  const initLevel = useCallback(() => {
    setTimeLeft(level.durationSeconds);
    setPollutionBar(35);
    setTrashCleanedCount(0);
    setCarriedItems([]);
    setWaterAmmo(100);
    setVillainHp(level.villainInfo.hp);
    setVillainDefeated(false);
    setProximityAlert(false);

    diverPos.current.set(0, 1.2, 0);
    villainPos.current.set(0, 1.8, -26);

    // Setup 50% Larger Bins in 3D (Placed in front of player on a harbor ledge)
    if (level.number >= 5) {
      // 7 bins
      const binTypes: TrashItem['type'][] = ['organico', 'plastico', 'papel', 'vidrio', 'peligroso', 'chatarra', 'quimico'];
      binsDataRef.current = binTypes.map((type, i) => {
        const meta = TRASH_META[type];
        return {
          id: `bin-${i + 1}`,
          type,
          name: meta.label,
          color: meta.glowColor,
          x: (i - 3) * 6.8, // spaced across X
          y: 0,
          z: 22, // at bottom edge of arena
          keyNumber: i + 1,
        };
      });
    } else {
      // 4 bins
      const binTypes: TrashItem['type'][] = ['organico', 'plastico', 'papel', 'vidrio'];
      binsDataRef.current = binTypes.map((type, i) => {
        const meta = TRASH_META[type];
        return {
          id: `bin-${i + 1}`,
          type,
          name: meta.label,
          color: meta.glowColor,
          x: (i - 1.5) * 10,
          y: 0,
          z: 22,
          keyNumber: i + 1,
        };
      });
    }

    // Generate initial trash items scattered in 3D arena
    const initialTrash: TrashItem[] = [];
    const availableTypes: TrashItem['type'][] = level.number >= 5
      ? ['organico', 'plastico', 'papel', 'vidrio', 'peligroso', 'chatarra', 'quimico']
      : ['organico', 'plastico', 'papel', 'vidrio'];

    const count = 10 + level.number * 2;
    for (let i = 0; i < count; i++) {
      const type = availableTypes[Math.floor(Math.random() * availableTypes.length)];
      const meta = TRASH_META[type];
      const icon = meta.icons[Math.floor(Math.random() * meta.icons.length)];

      const rx = (Math.random() - 0.5) * 48;
      const rz = -24 + Math.random() * 40;

      initialTrash.push({
        id: `trash-3d-${i}-${Date.now()}`,
        x: rx,
        y: 1.0,
        z: rz,
        type,
        name: meta.label,
        icon,
      });
    }
    trashDataRef.current = initialTrash;

    // Generate Time Grenades (+5s / -5s)
    const initialGrenades: TimeGrenade[] = [];
    // 3 bonus grenades (+5s)
    for (let i = 0; i < 4; i++) {
      initialGrenades.push({
        id: `grenade-plus-${i}`,
        type: 'bonus',
        x: (Math.random() - 0.5) * 44,
        y: 1.5,
        z: -20 + Math.random() * 34,
        collected: false,
      });
    }
    // 3 penalty grenades (-5s)
    for (let i = 0; i < 3; i++) {
      initialGrenades.push({
        id: `grenade-minus-${i}`,
        type: 'penalty',
        x: (Math.random() - 0.5) * 44,
        y: 1.5,
        z: -22 + Math.random() * 34,
        collected: false,
      });
    }
    grenadesDataRef.current = initialGrenades;

    // Level-specific setups
    if (level.specialMechanic === 'air_buttons') {
      airButtons3DRef.current = [
        { pos: new THREE.Vector3(-18, 1.2, -15), activated: false },
        { pos: new THREE.Vector3(18, 1.2, -15), activated: false },
        { pos: new THREE.Vector3(0, 1.2, -8), activated: false },
        { pos: new THREE.Vector3(-12, 1.2, 8), activated: false },
        { pos: new THREE.Vector3(12, 1.2, 8), activated: false },
      ];
      setAirButtonsFound(0);
    }

    if (level.specialMechanic === 'diablitos_trees') {
      soilSpots3DRef.current = [
        { pos: new THREE.Vector3(-16, 0.2, -18), planted: false },
        { pos: new THREE.Vector3(16, 0.2, -18), planted: false },
        { pos: new THREE.Vector3(-12, 0.2, -5), planted: false },
        { pos: new THREE.Vector3(12, 0.2, -5), planted: false },
        { pos: new THREE.Vector3(-20, 0.2, 6), planted: false },
        { pos: new THREE.Vector3(0, 0.2, 2), planted: false },
        { pos: new THREE.Vector3(20, 0.2, 6), planted: false },
        { pos: new THREE.Vector3(0, 0.2, 12), planted: false },
      ];
      setTreesPlantedInLevel(0);
    }

    if (level.specialMechanic === 'shark_egg_rescue') {
      barrels3DRef.current = [
        { pos: new THREE.Vector3(-20, 1.0, -22), defused: false },
        { pos: new THREE.Vector3(20, 1.0, -22), defused: false },
        { pos: new THREE.Vector3(-15, 1.0, 5), defused: false },
        { pos: new THREE.Vector3(15, 1.0, 5), defused: false },
        { pos: new THREE.Vector3(-8, 1.0, -10), defused: false },
        { pos: new THREE.Vector3(8, 1.0, -10), defused: false },
      ];
      egg3DRef.current = { pos: new THREE.Vector3(0, 1.5, -12) };
      setToxicBarrelsDefused(0);
      setDragonEggRescued(false);
    }

    if (level.specialMechanic === 'dino_nests') {
      nests3DRef.current = [
        { pos: new THREE.Vector3(-18, 0.8, -16), protected: false },
        { pos: new THREE.Vector3(18, 0.8, -16), protected: false },
        { pos: new THREE.Vector3(-10, 0.8, 4), protected: false },
        { pos: new THREE.Vector3(10, 0.8, 4), protected: false },
        { pos: new THREE.Vector3(0, 0.8, -8), protected: false },
      ];
      setDinoNestsProtected(0);
    }

    // Play appropriate sound cue
    if (level.number <= 2) {
      soundEngine.play1_DoAmbientacion();
    } else if (level.number <= 4) {
      soundEngine.play3_ReSuspensoDivertido();
    } else if (level.number <= 7) {
      soundEngine.play5_DoSuspensoLento();
    } else if (level.number === 8) {
      soundEngine.play8_MiMiedo();
    } else {
      soundEngine.play6_DoSuspensoLentoFuerte();
    }
  }, [level]);

  useEffect(() => {
    initLevel();
  }, [initLevel]);

  // Timer Tick
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          onLoseLevel('¡El tiempo se agotó antes de poder purificar el sector de Medellín!');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onLoseLevel]);

  // Water ammo regen
  useEffect(() => {
    const regen = setInterval(() => {
      setWaterAmmo(prev => Math.min(100, prev + 8));
    }, 700);
    return () => clearInterval(regen);
  }, []);

  // Win condition check
  useEffect(() => {
    let won = false;

    if (level.specialMechanic === 'air_buttons') {
      if (airButtonsFound >= 5 && trashCleanedCount >= 5) won = true;
    } else if (level.specialMechanic === 'friendly_monsters') {
      if (friendlyMonstersCount >= 3 && trashCleanedCount >= 8) won = true;
    } else if (level.specialMechanic === 'diablitos_trees') {
      if (treesPlantedInLevel >= 8) won = true;
    } else if (level.specialMechanic === 'shark_egg_rescue') {
      if (toxicBarrelsDefused >= 6 && dragonEggRescued) won = true;
    } else if (level.specialMechanic === 'dino_nests') {
      if (dinoNestsProtected >= 5 && trashCleanedCount >= 10) won = true;
    } else if (level.specialMechanic === 'boss_titan_plant') {
      if (villainDefeated) won = true;
    } else {
      if (trashCleanedCount >= level.requiredTrashToWin) won = true;
    }

    if (won) {
      const score = 400 + trashCleanedCount * 35 + timeLeft * 3;
      const coinsNorm = 100 + level.number * 25;
      const coinsSup = 3 + Math.floor(level.number / 2);
      const coinsImp = level.number >= 8 ? 2 : level.number >= 5 ? 1 : 0;
      const gems = level.number >= 8 ? 3 : 1;

      onWinLevel(score, coinsNorm, coinsSup, coinsImp, gems);
    }
  }, [
    trashCleanedCount,
    airButtonsFound,
    friendlyMonstersCount,
    treesPlantedInLevel,
    toxicBarrelsDefused,
    dragonEggRescued,
    dinoNestsProtected,
    villainDefeated,
    level,
    timeLeft,
    onWinLevel,
  ]);

  // Defeat condition check
  useEffect(() => {
    if (pollutionBar >= 100) {
      onLoseLevel('¡La contaminación alcanzó el 100%! El sector fue tragado por el vórtice de smog.');
    }
  }, [pollutionBar, onLoseLevel]);

  // Deposit Carried Trash into Target Bin
  const depositCarriedTrash = useCallback((bin: BinTarget) => {
    if (carriedItems.length === 0) return;

    const firstItem = carriedItems[0];
    const isCorrect =
      bin.type === firstItem.type ||
      (bin.type === 'plastico' && firstItem.type === 'plastico') ||
      (bin.type === 'organico' && firstItem.type === 'organico');

    if (isCorrect) {
      soundEngine.playRecycleSuccess();
      const count = carriedItems.length;
      setTrashCleanedCount(prev => prev + count);
      for (let i = 0; i < count; i++) onUpdateTrashRecycled();
      setPollutionBar(prev => Math.max(0, prev - 6 * count));

      setStatusMessage(
        `¡COMBO x${count}! Depositaste ${count}x ${firstItem.name} en ${bin.name} con tu Imán Eco!`
      );
    } else {
      soundEngine.play8_MiMiedo();
      setStatusMessage(`¡CUIDADO! Esa basura pertenece a la caneca [${TRASH_META[firstItem.type].binKey}]`);
    }

    setCarriedItems([]);
  }, [carriedItems, onUpdateTrashRecycled]);

  // Hotkey 1-7 deposition
  useEffect(() => {
    for (let k = 1; k <= 7; k++) {
      if (activeKeys.has(k.toString()) && carriedItems.length > 0) {
        const targetBin = binsDataRef.current.find(b => b.keyNumber === k);
        if (targetBin) {
          depositCarriedTrash(targetBin);
        }
      }
    }
  }, [activeKeys, carriedItems, depositCarriedTrash]);

  // THREE.JS SETUP & MAIN RENDER LOOP
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const aspect = container.clientWidth / container.clientHeight;
    const camera = new THREE.PerspectiveCamera(55, aspect, 0.1, 1000);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 2. Thematic Environment & Fog
    const envFogs: Record<string, number> = {
      sirena: 0x0284c7,
      mar: 0x075985,
      monstruos: 0x2e1065,
      vampiros: 0x180828,
      dragones: 0x450a0a,
      diablitos: 0x78350f,
      zombies: 0x064e3b,
      tiburones: 0x032030,
      dinosaurios: 0x14532d,
      planta_carnivora: 0x3b0764,
    };
    const fogColor = envFogs[level.theme] || 0x0f172a;
    scene.fog = new THREE.FogExp2(fogColor, 0.022);
    scene.background = new THREE.Color(fogColor);

    // 3. Lighting
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x1e293b, 1.2);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xfffbeb, 1.8);
    dirLight.position.set(20, 40, 20);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    // 4. Seafloor / Terrain
    const terrainGeo = new THREE.PlaneGeometry(120, 120, 32, 32);
    terrainGeo.rotateX(-Math.PI / 2);

    let groundColor = 0x0284c7;
    if (level.theme === 'diablitos') groundColor = 0xb45309; // desert sand
    else if (level.theme === 'dragones') groundColor = 0x1f1f1f; // basalt lava
    else if (level.theme === 'dinosaurios' || level.theme === 'planta_carnivora') groundColor = 0x14532d; // lush jungle
    else if (level.theme === 'zombies') groundColor = 0x1e293b; // asphalt city

    const terrainMat = new THREE.MeshStandardMaterial({
      color: groundColor,
      roughness: 0.8,
      metalness: 0.1,
    });
    const terrain = new THREE.Mesh(terrainGeo, terrainMat);
    terrain.receiveShadow = true;
    scene.add(terrain);

    // Scenery Decoratives (Corals / Trees / Pillars)
    const decorGroup = new THREE.Group();
    for (let i = 0; i < 24; i++) {
      const dx = (Math.random() - 0.5) * 80;
      const dz = -30 + Math.random() * 60;
      if (Math.hypot(dx, dz) < 8) continue;

      let decorGeo: THREE.BufferGeometry;
      let decorMat: THREE.Material;

      if (level.theme === 'diablitos') {
        // Desert Cacti
        decorGeo = new THREE.CylinderGeometry(0.4, 0.4, 3 + Math.random() * 2, 8);
        decorMat = new THREE.MeshStandardMaterial({ color: 0x65a30d });
      } else if (level.theme === 'dinosaurios' || level.theme === 'planta_carnivora') {
        // Giant prehistoric jungle ferns & palm trunks
        decorGeo = new THREE.ConeGeometry(1.8, 6 + Math.random() * 4, 6);
        decorMat = new THREE.MeshStandardMaterial({ color: 0x15803d });
      } else if (level.theme === 'dragones') {
        // Volcanic rocks
        decorGeo = new THREE.DodecahedronGeometry(1.5 + Math.random() * 2);
        decorMat = new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.9 });
      } else {
        // Ocean corals / pillars
        decorGeo = new THREE.CylinderGeometry(0.6, 1.2, 4 + Math.random() * 3, 8);
        decorMat = new THREE.MeshStandardMaterial({ color: i % 2 === 0 ? 0xf43f5e : 0x06b6d4 });
      }

      const decorMesh = new THREE.Mesh(decorGeo, decorMat);
      decorMesh.position.set(dx, 2, dz);
      decorMesh.castShadow = true;
      decorGroup.add(decorMesh);
    }
    scene.add(decorGroup);

    // 5. Procedural 3D Realistic DIVER Character
    const diverGroup = new THREE.Group();
    diverGroupRef.current = diverGroup;

    const suit = level.diverSuit;

    // Torso / Wetsuit
    const torsoGeo = new THREE.CapsuleGeometry(0.45, 0.8, 8, 16);
    const torsoMat = new THREE.MeshStandardMaterial({ color: suit.suitColor, roughness: 0.4 });
    const torsoMesh = new THREE.Mesh(torsoGeo, torsoMat);
    torsoMesh.castShadow = true;
    diverGroup.add(torsoMesh);

    // Twin Oxygen Scuba Tanks
    const tankGeo = new THREE.CylinderGeometry(0.14, 0.14, 1.0, 12);
    const tankMat = new THREE.MeshStandardMaterial({ color: suit.tankColor, metalness: 0.8, roughness: 0.2 });
    const leftTank = new THREE.Mesh(tankGeo, tankMat);
    leftTank.position.set(-0.2, 0.1, -0.42);
    const rightTank = new THREE.Mesh(tankGeo, tankMat);
    rightTank.position.set(0.2, 0.1, -0.42);
    diverGroup.add(leftTank);
    diverGroup.add(rightTank);

    // Scuba Helmet / Mask
    const headGeo = new THREE.SphereGeometry(0.35, 16, 16);
    const headMat = new THREE.MeshStandardMaterial({ color: suit.accentColor, roughness: 0.3 });
    const headMesh = new THREE.Mesh(headGeo, headMat);
    headMesh.position.set(0, 0.75, 0);

    // Glass Visor
    const visorGeo = new THREE.BoxGeometry(0.35, 0.22, 0.15);
    const visorMat = new THREE.MeshStandardMaterial({ color: suit.visorColor, transparent: true, opacity: 0.85, metalness: 0.9 });
    const visorMesh = new THREE.Mesh(visorGeo, visorMat);
    visorMesh.position.set(0, 0.75, 0.3);
    diverGroup.add(headMesh);
    diverGroup.add(visorMesh);

    // Headlamp Spotlight
    const headlamp = new THREE.SpotLight(0xffffff, 4, 30, Math.PI / 5, 0.4);
    headlamp.position.set(0, 0.8, 0.35);
    headlamp.target.position.set(0, 0.5, 10);
    diverGroup.add(headlamp);
    diverGroup.add(headlamp.target);

    // Diving Fins / Flippers
    const finGeo = new THREE.BoxGeometry(0.25, 0.05, 0.6);
    const finMat = new THREE.MeshStandardMaterial({ color: suit.tankColor });
    const leftFin = new THREE.Mesh(finGeo, finMat);
    leftFin.position.set(-0.24, -0.7, -0.3);
    const rightFin = new THREE.Mesh(finGeo, finMat);
    rightFin.position.set(0.24, -0.7, -0.3);
    diverGroup.add(leftFin);
    diverGroup.add(rightFin);

    // Speargun / Hydro-Purifier
    const gunGeo = new THREE.CylinderGeometry(0.06, 0.08, 0.9, 8);
    gunGeo.rotateX(Math.PI / 2);
    const gunMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.8 });
    const gunMesh = new THREE.Mesh(gunGeo, gunMat);
    gunMesh.position.set(0.35, 0.2, 0.5);
    diverGroup.add(gunMesh);

    scene.add(diverGroup);

    // 6. Procedural 3D UNIQUE VILLAIN
    const villainGroup = new THREE.Group();
    villainMeshRef.current = villainGroup;

    // Body based on villain theme
    const vInfo = level.villainInfo;
    const vColor = new THREE.Color(vInfo.color);

    const vBodyGeo = new THREE.DodecahedronGeometry(2.2, 1);
    const vBodyMat = new THREE.MeshStandardMaterial({ color: vColor, roughness: 0.6, metalness: 0.3 });
    const vBodyMesh = new THREE.Mesh(vBodyGeo, vBodyMat);
    vBodyMesh.castShadow = true;
    villainGroup.add(vBodyMesh);

    // Glowing Toxic Eyes
    const eyeGeo = new THREE.SphereGeometry(0.3, 8, 8);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.8, 0.8, 1.8);
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.8, 0.8, 1.8);
    villainGroup.add(leftEye);
    villainGroup.add(rightEye);

    // Crown / Spikes
    for (let s = 0; s < 5; s++) {
      const spikeGeo = new THREE.ConeGeometry(0.4, 1.4, 6);
      const spikeMat = new THREE.MeshStandardMaterial({ color: vInfo.secondaryColor });
      const spike = new THREE.Mesh(spikeGeo, spikeMat);
      spike.position.set((s - 2) * 0.7, 2.2, (Math.random() - 0.5) * 0.4);
      villainGroup.add(spike);
    }

    scene.add(villainGroup);

    // 7. Ambient Bubble particles
    const bubbleGeo = new THREE.SphereGeometry(0.08, 8, 8);
    const bubbleMat = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 });
    for (let b = 0; b < 40; b++) {
      const bubble = new THREE.Mesh(bubbleGeo, bubbleMat);
      bubble.position.set((Math.random() - 0.5) * 50, Math.random() * 8, (Math.random() - 0.5) * 50);
      scene.add(bubble);
      bubbleParticlesRef.current.push({ mesh: bubble, vy: 0.04 + Math.random() * 0.06 });
    }

    // Resize handler
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // 8. Animation & Render Loop
    let animId: number;
    let lastTime = performance.now();

    const renderLoop = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;
      const time = now / 1000;

      // A) DIVER MOVEMENT & SPEED GAIN BY LEVEL
      // Speed scales up visibly each level:
      const speedMult = 16 + (level.number * 2.2) + (avatar.speed * 2.5);
      const moveSpeed = speedMult * (superpowerActive ? 1.5 : 1.0) * dt;

      let moveZ = 0;
      let moveX = 0;

      if (activeKeys.has('w') || activeKeys.has('arrowup')) moveZ -= 1;
      if (activeKeys.has('s') || activeKeys.has('arrowdown')) moveZ += 1;
      if (activeKeys.has('a') || activeKeys.has('arrowleft')) moveX -= 1;
      if (activeKeys.has('d') || activeKeys.has('arrowright')) moveX += 1;

      if (moveX !== 0 || moveZ !== 0) {
        const length = Math.hypot(moveX, moveZ);
        moveX /= length;
        moveZ /= length;

        diverPos.current.x = Math.max(-28, Math.min(28, diverPos.current.x + moveX * moveSpeed));
        diverPos.current.z = Math.max(-28, Math.min(24, diverPos.current.z + moveZ * moveSpeed));

        // Smooth rotation towards movement direction
        const targetRot = Math.atan2(moveX, -moveZ);
        diverRotation.current = targetRot;

        // Fin kicking animation
        leftFin.rotation.x = Math.sin(time * 14) * 0.45;
        rightFin.rotation.x = -Math.sin(time * 14) * 0.45;
      } else {
        leftFin.rotation.x = 0;
        rightFin.rotation.x = 0;
      }

      // Update diver mesh position & tilt
      diverGroup.position.copy(diverPos.current);
      diverGroup.rotation.y = diverRotation.current;
      diverGroup.position.y = 1.2 + Math.sin(time * 3) * 0.15; // gentle buoyancy bob

      // B) CAMERA FOLLOWS DIVER
      const camTargetX = diverPos.current.x;
      const camTargetZ = diverPos.current.z + 12;
      const camTargetY = 9;

      camera.position.x += (camTargetX - camera.position.x) * 0.1;
      camera.position.y += (camTargetY - camera.position.y) * 0.1;
      camera.position.z += (camTargetZ - camera.position.z) * 0.1;
      camera.lookAt(diverPos.current.x, 1.5, diverPos.current.z);

      // C) VILLAIN AI & PROXIMITY ALERT
      const vDist = diverPos.current.distanceTo(villainPos.current);
      setVillainDistance(Math.round(vDist));

      if (vDist < 20) {
        setProximityAlert(true);
      } else {
        setProximityAlert(false);
      }

      if (!villainDefeated) {
        // Villain roams and chases player slowly
        const vDir = new THREE.Vector3().subVectors(diverPos.current, villainPos.current).normalize();
        const vSpeed = (2.5 + level.number * 0.4) * dt;

        villainPos.current.x += vDir.x * vSpeed;
        villainPos.current.z += vDir.z * vSpeed;

        villainGroup.position.copy(villainPos.current);
        villainGroup.position.y = 1.8 + Math.sin(time * 4) * 0.3;
        villainGroup.rotation.y = Math.atan2(vDir.x, vDir.z);

        // Squish wobble animation
        const vSquish = 1 + Math.sin(time * 6) * 0.1;
        villainGroup.scale.set(vSquish, 1 / vSquish, vSquish);
      } else {
        // IMMOBILIZED / CRYSTALLIZED VILLAIN ("dejar inmóvil")
        villainGroup.rotation.y += 0.01;
        villainGroup.position.y = 1.8;
      }

      // D) TORPEDOES WATER PROJECTILES (Shoot with Spacebar)
      for (let t = torpedoesRef.current.length - 1; t >= 0; t--) {
        const torp = torpedoesRef.current[t];
        torp.mesh.position.addScaledVector(torp.dir, 35 * dt);
        torp.life -= dt;

        // Check hit Villain
        if (!villainDefeated && torp.mesh.position.distanceTo(villainPos.current) < 2.5) {
          torp.life = 0;
          soundEngine.playRecycleSuccess();

          setVillainHp(prev => {
            const nextHp = Math.max(0, prev - 16);
            if (nextHp <= 0) {
              setVillainDefeated(true);
              soundEngine.play7_MiMotivacion();
              setStatusMessage(`¡VILLANO ${level.villainInfo.name} DERROTADO Y PURIFICADO! +500 PTS 💫`);

              // Turn villain mesh into gleaming purified emerald crystal
              vBodyMat.color.setHex(0x10b981);
              vBodyMat.metalness = 0.9;
              vBodyMat.roughness = 0.1;

              // Spawn bonus time grenades where villain fell!
              grenadesDataRef.current.push({
                id: `drop-grenade-${Date.now()}`,
                type: 'bonus',
                x: villainPos.current.x + 2,
                y: 1.5,
                z: villainPos.current.z,
                collected: false,
              });
            }
            return nextHp;
          });
        }

        if (torp.life <= 0) {
          scene.remove(torp.mesh);
          torpedoesRef.current.splice(t, 1);
        }
      }

      // E) ECO-MAGNET: Suck nearby trash of matching type
      trashDataRef.current.forEach(trash => {
        const tPos = new THREE.Vector3(trash.x, trash.y, trash.z || 0);
        const distToDiver = diverPos.current.distanceTo(tPos);

        // Magnet attraction radius
        if (carriedItems.length > 0 && carriedItems.length < maxStack) {
          const first = carriedItems[0];
          if (trash.type === first.type && distToDiver < 8.5) {
            // Magnetic pull!
            const pullDir = new THREE.Vector3().subVectors(diverPos.current, tPos).normalize();
            trash.x += pullDir.x * 12 * dt;
            trash.z = (trash.z || 0) + pullDir.z * 12 * dt;
          }
        }

        // Automatic pick-up when touching (or pressing E)
        if (distToDiver < 2.5) {
          if (carriedItems.length === 0) {
            setCarriedItems([trash]);
            trashDataRef.current = trashDataRef.current.filter(item => item.id !== trash.id);
            soundEngine.playClick();
            setStatusMessage(`¡LLEVAS [1 / ${maxStack}] ${trash.name}! ¡Usa el Imán para recoger más del mismo tipo!`);
          } else if (carriedItems.length < maxStack && carriedItems[0].type === trash.type) {
            setCarriedItems(prev => [...prev, trash]);
            trashDataRef.current = trashDataRef.current.filter(item => item.id !== trash.id);
            soundEngine.playClick();
            setStatusMessage(`¡IMÁN ECO! [${carriedItems.length + 1} / ${maxStack}] ${trash.name} acumulados.`);
          }
        }
      });

      // F) TIME GRENADES COLLISION (+5s / -5s)
      grenadesDataRef.current.forEach(g => {
        if (!g.collected) {
          const gPos = new THREE.Vector3(g.x, g.y, g.z);
          if (diverPos.current.distanceTo(gPos) < 2.2) {
            g.collected = true;

            if (g.type === 'bonus') {
              setTimeLeft(prev => prev + 5);
              soundEngine.play7_MiMotivacion();
              setTimeFlash({ text: '+5 SEGUNDOS ⏱️', color: 'text-emerald-400' });
            } else {
              setTimeLeft(prev => Math.max(1, prev - 5));
              soundEngine.play8_MiMiedo();
              setTimeFlash({ text: '-5 SEGUNDOS ⚠️', color: 'text-rose-400' });
            }

            setTimeout(() => setTimeFlash(null), 1400);
          }
        }
      });

      // G) CANECAS 50% MÁS GRANDES COLLISION
      binsDataRef.current.forEach(bin => {
        const binPos = new THREE.Vector3(bin.x, 0, bin.z || 22);
        if (carriedItems.length > 0 && diverPos.current.distanceTo(binPos) < 5.8) {
          depositCarriedTrash(bin);
        }
      });

      // H) Update 3D Visual Meshes for Trash & Grenades & Bins
      update3DMeshes(scene, time);

      // Bubble particle rising
      bubbleParticlesRef.current.forEach(b => {
        b.mesh.position.y += b.vy;
        if (b.mesh.position.y > 10) b.mesh.position.y = 0.2;
      });

      renderer.render(scene, camera);
      animId = requestAnimationFrame(renderLoop);
    };

    animId = requestAnimationFrame(renderLoop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, [
    level,
    avatar,
    activeKeys,
    carriedItems,
    maxStack,
    superpowerActive,
    villainDefeated,
    depositCarriedTrash,
  ]);

  // Update 3D Meshes for entities
  const update3DMeshes = (scene: THREE.Scene, time: number) => {
    // Trash 3D meshes
    trashDataRef.current.forEach(trash => {
      let g = trashMeshesRef.current.get(trash.id);
      if (!g) {
        g = new THREE.Group();
        const meta = TRASH_META[trash.type];

        // Glowing outer cylinder
        const cGeo = new THREE.CylinderGeometry(0.7, 0.7, 0.4, 16);
        const cMat = new THREE.MeshStandardMaterial({
          color: meta.glowColor,
          roughness: 0.3,
          metalness: 0.5,
        });
        const cMesh = new THREE.Mesh(cGeo, cMat);
        g.add(cMesh);

        // Core jewel
        const jGeo = new THREE.DodecahedronGeometry(0.4);
        const jMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const jMesh = new THREE.Mesh(jGeo, jMat);
        jMesh.position.y = 0.25;
        g.add(jMesh);

        scene.add(g);
        trashMeshesRef.current.set(trash.id, g);
      }

      g.position.set(trash.x, trash.y + Math.sin(time * 4 + trash.x) * 0.15, trash.z || 0);
      g.rotation.y += 0.02;
    });

    // Clean up removed trash
    trashMeshesRef.current.forEach((g, id) => {
      if (!trashDataRef.current.some(t => t.id === id)) {
        scene.remove(g);
        trashMeshesRef.current.delete(id);
      }
    });

    // Time Grenades 3D Meshes
    grenadesDataRef.current.forEach(g => {
      let mesh = grenadesMeshesRef.current.get(g.id);
      if (!mesh && !g.collected) {
        mesh = new THREE.Group();
        const sphereGeo = new THREE.SphereGeometry(0.55, 12, 12);
        const sphereMat = new THREE.MeshStandardMaterial({
          color: g.type === 'bonus' ? 0x10b981 : 0xef4444,
          metalness: 0.8,
          roughness: 0.2,
        });
        const sphere = new THREE.Mesh(sphereGeo, sphereMat);
        mesh.add(sphere);

        // Ring
        const ringGeo = new THREE.TorusGeometry(0.75, 0.06, 8, 24);
        const ringMat = new THREE.MeshBasicMaterial({ color: g.type === 'bonus' ? 0x34d399 : 0xf87171 });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2;
        mesh.add(ring);

        scene.add(mesh);
        grenadesMeshesRef.current.set(g.id, mesh);
      }

      if (mesh) {
        if (g.collected) {
          scene.remove(mesh);
          grenadesMeshesRef.current.delete(g.id);
        } else {
          mesh.position.set(g.x, g.y + Math.sin(time * 5 + g.x) * 0.2, g.z);
          mesh.rotation.y += 0.04;
        }
      }
    });

    // 50% LARGER BINS 3D Meshes
    binsDataRef.current.forEach(bin => {
      let bGroup = binsMeshesRef.current.get(bin.id);
      if (!bGroup) {
        bGroup = new THREE.Group();
        const meta = TRASH_META[bin.type];

        // 50% Larger 3D Bin Body (Cylinder)
        const bGeo = new THREE.CylinderGeometry(1.6, 1.4, 2.6, 16);
        const bMat = new THREE.MeshStandardMaterial({
          color: meta.glowColor,
          roughness: 0.4,
          metalness: 0.6,
        });
        const bMesh = new THREE.Mesh(bGeo, bMat);
        bMesh.position.y = 1.3;
        bGroup.add(bMesh);

        // Bin Lid
        const lidGeo = new THREE.CylinderGeometry(1.7, 1.7, 0.4, 16);
        const lidMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8 });
        const lidMesh = new THREE.Mesh(lidGeo, lidMat);
        lidMesh.position.y = 2.7;
        bGroup.add(lidMesh);

        // Vertical light beam beacon
        const beamGeo = new THREE.CylinderGeometry(0.2, 0.2, 8, 8);
        const beamMat = new THREE.MeshBasicMaterial({ color: meta.glowColor, transparent: true, opacity: 0.35 });
        const beam = new THREE.Mesh(beamGeo, beamMat);
        beam.position.y = 6.0;
        bGroup.add(beam);

        scene.add(bGroup);
        binsMeshesRef.current.set(bin.id, bGroup);
      }

      bGroup.position.set(bin.x, 0, bin.z || 22);
    });
  };

  // Shoot Torpedo with Spacebar
  const shootTorpedo = () => {
    if (waterAmmo <= 0 || !sceneRef.current) return;
    setWaterAmmo(prev => Math.max(0, prev - 15));
    soundEngine.playWaterSpray();

    const dir = new THREE.Vector3(
      Math.sin(diverRotation.current),
      0,
      -Math.cos(diverRotation.current)
    ).normalize();

    const torpGeo = new THREE.SphereGeometry(0.35, 8, 8);
    const torpMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const torpMesh = new THREE.Mesh(torpGeo, torpMat);
    torpMesh.position.copy(diverPos.current).add(new THREE.Vector3(0, 0.3, 0));

    sceneRef.current.add(torpMesh);
    torpedoesRef.current.push({ mesh: torpMesh, dir, life: 1.2 });
  };

  // Keyboard trigger for shooting
  useEffect(() => {
    if (activeKeys.has(' ')) {
      shootTorpedo();
    }
  }, [activeKeys]);

  return (
    <div className="flex flex-col items-center w-full max-w-5xl mx-auto space-y-3">
      {/* Top HUD Bar */}
      <div className="w-full bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-3xl p-3 shadow-xl flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Level & Environment */}
        <div className="flex items-center gap-2.5">
          <div className="px-3 py-1 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-black text-sm">
            Nivel {level.number} (3D)
          </div>
          <div>
            <h2 className="font-fun text-sm font-bold text-white flex items-center gap-1.5">
              <span>{level.title}</span>
              <span className="text-[10px] text-sky-400 bg-sky-950/50 px-2 py-0.5 rounded-full border border-sky-500/30">
                {level.diverSuit.suitName}
              </span>
            </h2>
            <span className="text-[10px] text-amber-300 font-mono block">
              Entorno: {level.environmentName}
            </span>
          </div>
        </div>

        {/* Timer */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-slate-800/80 border border-slate-700 font-mono font-bold text-amber-400">
          <Timer className="w-4 h-4 text-amber-400" />
          <span>{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
        </div>

        {/* Villain HP & Status */}
        <div className="flex items-center gap-2 bg-slate-950/80 border border-rose-500/40 px-3 py-1 rounded-2xl">
          <span className="text-xl">{level.villainInfo.avatar}</span>
          <div>
            <div className="flex justify-between text-[10px] font-bold">
              <span className="text-rose-400">{level.villainInfo.name}:</span>
              <span className={villainDefeated ? 'text-emerald-400' : 'text-rose-300'}>
                {villainDefeated ? '¡INMÓVIL / DERROTADO!' : `${villainHp} HP`}
              </span>
            </div>
            <div className="w-24 bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full transition-all ${villainDefeated ? 'bg-emerald-400' : 'bg-rose-500'}`}
                style={{ width: `${(villainHp / level.villainInfo.maxHp) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Eco-Magnet Container Status */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-2xl bg-purple-950/40 border border-purple-500/40 text-purple-300 font-bold text-[11px]">
          <Magnet className="w-3.5 h-3.5 text-purple-400" />
          <span>
            Imán: [{carriedItems.length} / {maxStack}]{' '}
            {carriedItems.length > 0 ? carriedItems[0].name : 'Vacío'}
          </span>
        </div>

        {/* Water ammo */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 font-bold text-[11px]">
          <Droplets className="w-3.5 h-3.5" />
          <span>Torpedos: {Math.round(waterAmmo)}%</span>
        </div>
      </div>

      {/* 3D Viewport with PROXIMITY ALERT RADAR */}
      <div className="relative w-full aspect-[4/3] max-h-[580px] rounded-3xl overflow-hidden border-2 border-slate-800 shadow-2xl bg-slate-950">
        <div ref={mountRef} className="w-full h-full cursor-crosshair" />

        {/* Proximity Alert Warning Screen Vignette */}
        {proximityAlert && (
          <div className="absolute inset-0 pointer-events-none border-4 border-rose-500/80 animate-pulse bg-rose-950/20 flex flex-col items-center justify-start pt-12">
            <div className="bg-rose-950/90 border border-rose-500 text-rose-300 px-4 py-1.5 rounded-full font-black text-xs tracking-wider shadow-2xl flex items-center gap-2 animate-bounce">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>⚠️ ¡ALERTA DE PROXIMIDAD! {level.villainInfo.name} a {villainDistance}m ⚠️</span>
            </div>
          </div>
        )}

        {/* Time Grenade Pop-Up Notification */}
        {timeFlash && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-slate-900/90 border border-slate-700 px-5 py-2 rounded-2xl font-black text-sm shadow-2xl animate-bounce">
            <span className={timeFlash.color}>{timeFlash.text}</span>
          </div>
        )}

        {/* Dynamic Status Ticker */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-slate-950/85 backdrop-blur-md px-4 py-1.5 rounded-full border border-emerald-500/40 text-emerald-300 text-xs font-bold tracking-wide shadow-xl pointer-events-none flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>{statusMessage}</span>
        </div>

        {/* NPC Encounter prompt if available */}
        <div className="absolute top-3 right-3">
          <button
            onClick={() => {
              soundEngine.playClick();
              onTriggerNPC();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400 text-amber-300 text-xs font-bold transition shadow-lg animate-bounce"
          >
            <span>💬</span>
            <span>Pregunta Paisa (+Monedas)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
