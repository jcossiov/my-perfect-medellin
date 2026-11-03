import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  LevelConfig,
  PlayerAvatar,
  PlayerEconomy,
  TrashItem,
  BinTarget,
  DragonPet,
  TimeGrenade,
} from '../types/game';
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
  ShieldAlert,
} from 'lucide-react';

interface LevelCanvasProps {
  level: LevelConfig;
  avatar: PlayerAvatar;
  economy: PlayerEconomy;
  dragon: DragonPet;
  onWinLevel: (
    scoreGained: number,
    coinsNormal: number,
    coinsSuprema: number,
    coinsImposible: number,
    gems: number
  ) => void;
  onLoseLevel: (reason: string) => void;
  onUpdateTrashRecycled: () => void;
  onUpdateTreesPlanted: () => void;
  onTriggerNPC: () => void;
  activeKeys: Set<string>;
  superpowerActive: boolean;
}

// Visual metadata for distinct trash differentiation
export const TRASH_META: Record<
  TrashItem['type'],
  {
    label: string;
    glowColor: string;
    borderColor: string;
    bgColor: string;
    icons: string[];
    binKey: number;
    binName: string;
  }
> = {
  organico: {
    label: 'ORGÁNICO',
    glowColor: '#10b981',
    borderColor: '#34d399',
    bgColor: 'rgba(6, 78, 59, 0.85)',
    icons: ['🍌', '🍎', '🍉', '🦴', '🥑', '🥦'],
    binKey: 1,
    binName: 'Caneca Verde [1]',
  },
  plastico: {
    label: 'PLÁSTICO',
    glowColor: '#38bdf8',
    borderColor: '#e2e8f0',
    bgColor: 'rgba(15, 23, 42, 0.85)',
    icons: ['🥤', '🧴', '🛍️', '🍶', '🧃', '🪣'],
    binKey: 2,
    binName: 'Caneca Blanca [2]',
  },
  papel: {
    label: 'PAPEL',
    glowColor: '#60a5fa',
    borderColor: '#93c5fd',
    bgColor: 'rgba(30, 58, 138, 0.85)',
    icons: ['📦', '📄', '📰', '🗞️', '📜', '📁'],
    binKey: 3,
    binName: 'Caneca Azul [3]',
  },
  vidrio: {
    label: 'VIDRIO',
    glowColor: '#2dd4bf',
    borderColor: '#5eead4',
    bgColor: 'rgba(19, 78, 74, 0.85)',
    icons: ['🍾', '🍷', '🏺', '🫙', '🍸', '🥛'],
    binKey: 4,
    binName: 'Caneca Gris [4]',
  },
  peligroso: {
    label: 'PELIGROSO',
    glowColor: '#ef4444',
    borderColor: '#f87171',
    bgColor: 'rgba(127, 29, 29, 0.85)',
    icons: ['🔋', '⚠️', '🪫', '🩹', '🧯', '💉'],
    binKey: 5,
    binName: 'Caneca Roja [5]',
  },
  chatarra: {
    label: 'CHATARRA',
    glowColor: '#f97316',
    borderColor: '#fb923c',
    bgColor: 'rgba(124, 45, 18, 0.85)',
    icons: ['🔩', '⚙️', '🔧', '🥫', '⛓️', '🔨'],
    binKey: 6,
    binName: 'Caneca Naranja [6]',
  },
  quimico: {
    label: 'QUÍMICO',
    glowColor: '#c084fc',
    borderColor: '#d8b4fe',
    bgColor: 'rgba(88, 28, 135, 0.85)',
    icons: ['🧪', '☣️', '☢️', '🧫', '🧴', '💀'],
    binKey: 7,
    binName: 'Caneca Púrpura [7]',
  },
};

export const LevelCanvas: React.FC<LevelCanvasProps> = ({
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
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Discrete game state (for UI header display)
  const [timeLeft, setTimeLeft] = useState(level.durationSeconds);
  const [pollutionBar, setPollutionBar] = useState(25);
  const [trashCleanedCount, setTrashCleanedCount] = useState(0);
  const [waterAmmo, setWaterAmmo] = useState(100);
  const [statusMessage, setStatusMessage] = useState<string>(
    '¡Controla al BUCEADOR! [ESPACIO] Torpedo de agua para derrotar al villano, [E] Recoger con Imán.'
  );

  // Time Grenade notification
  const [timeFlash, setTimeFlash] = useState<{ text: string; color: string } | null>(null);

  // Villain UI State
  const [villainHp, setVillainHp] = useState(level.villainInfo.hp);
  const [villainDefeated, setVillainDefeated] = useState(false);
  const [proximityAlert, setProximityAlert] = useState(false);
  const [villainDistance, setVillainDistance] = useState(85);

  // Eco-Magnet: stack limit per level
  const maxStack = Math.min(4, 1 + Math.floor(level.number / 2));
  const [carriedCount, setCarriedCount] = useState(0);
  const [carriedTypeName, setCarriedTypeName] = useState<string>('Vacío');

  // Special level objective counters
  const [airButtonsFound, setAirButtonsFound] = useState(0);
  const [friendlyMonstersCount, setFriendlyMonstersCount] = useState(0);
  const [treesPlantedInLevel, setTreesPlantedInLevel] = useState(0);
  const [toxicBarrelsDefused, setToxicBarrelsDefused] = useState(0);
  const [dragonEggRescued, setDragonEggRescued] = useState(false);
  const [dinoNestsProtected, setDinoNestsProtected] = useState(0);

  // High-performance refs for zero-lag 60fps loop
  const carriedItemsRef = useRef<TrashItem[]>([]);
  const villainHpRef = useRef(level.villainInfo.hp);
  const villainDefeatedRef = useRef(false);
  const proximityAlertRef = useRef(false);
  const villainDistanceRef = useRef(85);
  const pollutionBarRef = useRef(25);
  const trashCleanedRef = useRef(0);
  const activeKeysRef = useRef(activeKeys);
  const superpowerRef = useRef(superpowerActive);

  // Sync refs when props update
  useEffect(() => {
    activeKeysRef.current = activeKeys;
  }, [activeKeys]);

  useEffect(() => {
    superpowerRef.current = superpowerActive;
  }, [superpowerActive]);

  // Entities state
  const playerRef = useRef({
    x: 400,
    y: 280,
    facing: 'right',
    waterSprayCooldown: 0,
    finAngle: 0,
  });

  const villainRef = useRef({
    x: 160,
    y: 150,
    vx: 1.2,
    vy: 0.8,
    vomitTimer: 0,
    stunTimer: 0,
    sizeScale: 1.45 + level.number * 0.05,
  });

  const trashItemsRef = useRef<TrashItem[]>([]);
  const grenadesRef = useRef<TimeGrenade[]>([]);
  const waterStreamsRef = useRef<{ x: number; y: number; vx: number; vy: number; life: number }[]>([]);
  const bubblesRef = useRef<{ x: number; y: number; vy: number; size: number }[]>([]);
  const particlesRef = useRef<
    { x: number; y: number; vx: number; vy: number; color: string; life: number; size: number }[]
  >([]);

  // Special interactables
  const airButtonsRef = useRef<{ x: number; y: number; activated: boolean }[]>([]);
  const parkMonstersRef = useRef<{ x: number; y: number; hp: number; isFriendly: boolean }[]>([]);
  const soilSpotsRef = useRef<{ x: number; y: number; planted: boolean }[]>([]);
  const toxicBarrelsRef = useRef<{ x: number; y: number; defused: boolean }[]>([]);
  const dinoNestsRef = useRef<{ x: number; y: number; protected: boolean }[]>([]);
  const sharksRef = useRef<{ x: number; y: number; vx: number; vy: number }[]>([]);

  // 50% LARGER BINS
  const binsRef = useRef<BinTarget[]>([]);

  // Helper to spawn a single clean piece of trash (keeps screen clean & unsaturated)
  const spawnSingleTrash = useCallback(() => {
    const availableTypes: TrashItem['type'][] =
      level.number >= 5
        ? ['organico', 'plastico', 'papel', 'vidrio', 'peligroso', 'chatarra', 'quimico']
        : ['organico', 'plastico', 'papel', 'vidrio'];

    const type = availableTypes[Math.floor(Math.random() * availableTypes.length)];
    const meta = TRASH_META[type];
    const icon = meta.icons[Math.floor(Math.random() * meta.icons.length)];

    return {
      id: `trash-${Date.now()}-${Math.random()}`,
      x: 110 + Math.random() * 580,
      y: 90 + Math.random() * 320,
      type,
      name: meta.label,
      icon,
    };
  }, [level.number]);

  // Initialize level
  const initLevel = useCallback(() => {
    setTimeLeft(level.durationSeconds);
    setPollutionBar(25);
    pollutionBarRef.current = 25;
    setTrashCleanedCount(0);
    trashCleanedRef.current = 0;
    carriedItemsRef.current = [];
    setCarriedCount(0);
    setCarriedTypeName('Vacío');
    setWaterAmmo(100);

    villainHpRef.current = level.villainInfo.hp;
    setVillainHp(level.villainInfo.hp);
    villainDefeatedRef.current = false;
    setVillainDefeated(false);
    proximityAlertRef.current = false;
    setProximityAlert(false);

    playerRef.current.x = 400;
    playerRef.current.y = 280;
    villainRef.current.x = 160;
    villainRef.current.y = 150;
    villainRef.current.stunTimer = 0;
    villainRef.current.sizeScale = 1.45 + level.number * 0.05;

    // 50% LARGER BINS: Dynamic positioning
    if (level.number >= 5) {
      binsRef.current = [
        { id: 'bin-1', type: 'organico', name: 'Orgánico (Verde)', color: '#10b981', x: 65, y: 535, keyNumber: 1 },
        { id: 'bin-2', type: 'plastico', name: 'Plástico (Blanco)', color: '#f8fafc', x: 175, y: 535, keyNumber: 2 },
        { id: 'bin-3', type: 'papel', name: 'Papel (Azul)', color: '#38bdf8', x: 285, y: 535, keyNumber: 3 },
        { id: 'bin-4', type: 'vidrio', name: 'Vidrio (Gris)', color: '#94a3b8', x: 395, y: 535, keyNumber: 4 },
        { id: 'bin-5', type: 'peligroso', name: 'Peligroso (Rojo)', color: '#ef4444', x: 505, y: 535, keyNumber: 5 },
        { id: 'bin-6', type: 'chatarra', name: 'Chatarra (Naranja)', color: '#f97316', x: 615, y: 535, keyNumber: 6 },
        { id: 'bin-7', type: 'quimico', name: 'Químico (Púrpura)', color: '#a855f7', x: 725, y: 535, keyNumber: 7 },
      ];
    } else {
      binsRef.current = [
        { id: 'bin-1', type: 'organico', name: 'Orgánico (Verde)', color: '#10b981', x: 120, y: 535, keyNumber: 1 },
        { id: 'bin-2', type: 'plastico', name: 'Plástico (Blanco)', color: '#f8fafc', x: 300, y: 535, keyNumber: 2 },
        { id: 'bin-3', type: 'papel', name: 'Papel (Azul)', color: '#38bdf8', x: 480, y: 535, keyNumber: 3 },
        { id: 'bin-4', type: 'vidrio', name: 'Vidrio (Gris)', color: '#94a3b8', x: 660, y: 535, keyNumber: 4 },
      ];
    }

    // STRICTLY 4-5 PIECES OF TRASH: Screen remains clean, readable & unsaturated
    const initialTrash: TrashItem[] = [];
    const count = 4;
    for (let i = 0; i < count; i++) {
      initialTrash.push(spawnSingleTrash());
    }
    trashItemsRef.current = initialTrash;

    // Time Grenades (+5s and -5s)
    const initialGrenades: TimeGrenade[] = [
      { id: 'tg-plus-1', type: 'bonus', x: 160 + Math.random() * 480, y: 110 + Math.random() * 260, z: 0, collected: false },
      { id: 'tg-minus-1', type: 'penalty', x: 160 + Math.random() * 480, y: 110 + Math.random() * 260, z: 0, collected: false },
    ];
    grenadesRef.current = initialGrenades;

    // Ambient bubbles (kept lightweight for 60fps)
    bubblesRef.current = Array.from({ length: 15 }, () => ({
      x: Math.random() * 800,
      y: Math.random() * 550,
      vy: 0.5 + Math.random() * 1.0,
      size: 2 + Math.random() * 3,
    }));

    // Level-specific setups
    if (level.specialMechanic === 'air_buttons') {
      airButtonsRef.current = [
        { x: 140, y: 150, activated: false },
        { x: 660, y: 140, activated: false },
        { x: 400, y: 220, activated: false },
        { x: 230, y: 390, activated: false },
        { x: 570, y: 390, activated: false },
      ];
      setAirButtonsFound(0);
    }

    if (level.specialMechanic === 'friendly_monsters') {
      parkMonstersRef.current = [
        { x: 210, y: 190, hp: 100, isFriendly: false },
        { x: 420, y: 160, hp: 100, isFriendly: false },
        { x: 590, y: 230, hp: 100, isFriendly: false },
      ];
      setFriendlyMonstersCount(0);
    }

    if (level.specialMechanic === 'diablitos_trees') {
      soilSpotsRef.current = [
        { x: 150, y: 180, planted: false },
        { x: 280, y: 140, planted: false },
        { x: 520, y: 150, planted: false },
        { x: 650, y: 180, planted: false },
        { x: 160, y: 380, planted: false },
        { x: 300, y: 400, planted: false },
        { x: 500, y: 390, planted: false },
        { x: 640, y: 380, planted: false },
      ];
      setTreesPlantedInLevel(0);
    }

    if (level.specialMechanic === 'shark_egg_rescue') {
      sharksRef.current = [
        { x: 200, y: 200, vx: 2.0, vy: 1.0 },
        { x: 550, y: 300, vx: -2.2, vy: -1.1 },
      ];
      toxicBarrelsRef.current = [
        { x: 130, y: 130, defused: false },
        { x: 670, y: 130, defused: false },
        { x: 190, y: 410, defused: false },
        { x: 610, y: 410, defused: false },
        { x: 390, y: 150, defused: false },
      ];
      setToxicBarrelsDefused(0);
      setDragonEggRescued(false);
    }

    if (level.specialMechanic === 'dino_nests') {
      dinoNestsRef.current = [
        { x: 160, y: 190, protected: false },
        { x: 310, y: 150, protected: false },
        { x: 490, y: 160, protected: false },
        { x: 640, y: 210, protected: false },
        { x: 400, y: 370, protected: false },
      ];
      setDinoNestsProtected(0);
    }

    // Play initial musical note
    if (level.number <= 2) soundEngine.play1_DoAmbientacion();
    else if (level.number <= 4) soundEngine.play3_ReSuspensoDivertido();
    else if (level.number <= 7) soundEngine.play5_DoSuspensoLento();
    else if (level.number === 8) soundEngine.play8_MiMiedo();
    else soundEngine.play6_DoSuspensoLentoFuerte();
  }, [level, spawnSingleTrash]);

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
      setWaterAmmo(prev => Math.min(100, prev + 10));
    }, 600);
    return () => clearInterval(regen);
  }, []);

  // Check Win Condition
  useEffect(() => {
    let won = false;

    if (level.specialMechanic === 'air_buttons') {
      if (airButtonsFound >= 5 && trashCleanedCount >= 4) won = true;
    } else if (level.specialMechanic === 'friendly_monsters') {
      if (friendlyMonstersCount >= 3 && trashCleanedCount >= 5) won = true;
    } else if (level.specialMechanic === 'diablitos_trees') {
      if (treesPlantedInLevel >= 6) won = true;
    } else if (level.specialMechanic === 'shark_egg_rescue') {
      if (toxicBarrelsDefused >= 5 && dragonEggRescued) won = true;
    } else if (level.specialMechanic === 'dino_nests') {
      if (dinoNestsProtected >= 5 && trashCleanedCount >= 5) won = true;
    } else if (level.specialMechanic === 'boss_titan_plant') {
      if (villainDefeated) won = true;
    } else {
      if (trashCleanedCount >= level.requiredTrashToWin) won = true;
    }

    if (won) {
      const score = 350 + trashCleanedCount * 30 + timeLeft * 3;
      const coinsNorm = 90 + level.number * 20;
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

  // Deposit Carried Trash into Target Bin (Eco-Magnet Multi-Stack)
  const depositCarriedTrash = useCallback(
    (bin: BinTarget) => {
      if (carriedItemsRef.current.length === 0) return;

      const firstItem = carriedItemsRef.current[0];
      const isCorrect =
        bin.type === firstItem.type ||
        (firstItem.type === 'quimico' && bin.type === 'peligroso');

      const itemsCount = carriedItemsRef.current.length;

      if (isCorrect) {
        soundEngine.playRecycleSuccess();
        const scoreBonus = itemsCount * 65;
        trashCleanedRef.current += itemsCount;
        setTrashCleanedCount(trashCleanedRef.current);

        pollutionBarRef.current = Math.max(0, pollutionBarRef.current - itemsCount * 5);
        setPollutionBar(pollutionBarRef.current);

        onUpdateTrashRecycled();
        setStatusMessage(
          `¡EXCELENTE! Clasificaste ${itemsCount} residuo(s) en ${bin.name}. +${scoreBonus} PTS! 🎉`
        );

        // Spawn gentle sparkle particles
        for (let i = 0; i < 8; i++) {
          particlesRef.current.push({
            x: bin.x + (Math.random() - 0.5) * 30,
            y: bin.y - 20,
            vx: (Math.random() - 0.5) * 120,
            vy: -80 - Math.random() * 80,
            color: bin.color,
            life: 0.8,
            size: 4 + Math.random() * 4,
          });
        }
      } else {
        soundEngine.play2_DoGraveLeve();
        pollutionBarRef.current = Math.min(100, pollutionBarRef.current + 6);
        setPollutionBar(pollutionBarRef.current);
        setStatusMessage(`¡CUIDADO! ${firstItem.name} va en otra caneca. La contaminación aumentó.`);
      }

      // Empty carried inventory
      carriedItemsRef.current = [];
      setCarriedCount(0);
      setCarriedTypeName('Vacío');

      // Replenish 1-2 pieces to maintain clean 4 items on screen
      if (trashItemsRef.current.length < 4) {
        trashItemsRef.current.push(spawnSingleTrash());
      }
    },
    [onUpdateTrashRecycled, spawnSingleTrash]
  );

  // Click / tap shoot or interact
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * 800;
    const clickY = ((e.clientY - rect.top) / rect.height) * 600;

    // Shoot water torpedo towards click
    if (waterAmmo >= 15) {
      setWaterAmmo(prev => Math.max(0, prev - 15));
      soundEngine.playWaterSpray();

      const angle = Math.atan2(clickY - playerRef.current.y, clickX - playerRef.current.x);
      const speed = 480;

      waterStreamsRef.current.push({
        x: playerRef.current.x,
        y: playerRef.current.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.4,
      });

      playerRef.current.facing = clickX >= playerRef.current.x ? 'right' : 'left';
    }
  };

  // -------------------------------------------------------------------------
  // HIGH-PERFORMANCE 60FPS GAME LOOP (ZERO REACT RE-RENDER OVERHEAD)
  // -------------------------------------------------------------------------
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();
    let uiTicker = 0;

    const loop = (currentTime: number) => {
      const rawDt = (currentTime - lastTime) / 1000;
      lastTime = currentTime;
      const dt = Math.min(rawDt, 0.04); // clamp dt to avoid physics jump
      const timeSec = currentTime / 1000;

      const canvas = canvasRef.current;
      if (!canvas) {
        animId = requestAnimationFrame(loop);
        return;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        animId = requestAnimationFrame(loop);
        return;
      }

      const width = 800;
      const height = 600;
      const keys = activeKeysRef.current;

      // 1. PLAYER MOVEMENT & FIN KICK ANIMATION
      const baseSpeed = 190 + level.diverSuit.bonusSpeed * 6 + (avatar.speed - 1) * 20;
      const moveSpeed = superpowerRef.current ? baseSpeed * 1.5 : baseSpeed;

      let dx = 0;
      let dy = 0;
      if (keys.has('arrowleft') || keys.has('a')) dx -= 1;
      if (keys.has('arrowright') || keys.has('d')) dx += 1;
      if (keys.has('arrowup') || keys.has('w')) dy -= 1;
      if (keys.has('arrowdown') || keys.has('s')) dy += 1;

      if (dx !== 0 && dy !== 0) {
        dx *= 0.707;
        dy *= 0.707;
      }

      if (dx !== 0 || dy !== 0) {
        playerRef.current.x += dx * moveSpeed * dt;
        playerRef.current.y += dy * moveSpeed * dt;
        playerRef.current.finAngle = Math.sin(timeSec * 16) * 0.45;
        if (dx > 0) playerRef.current.facing = 'right';
        if (dx < 0) playerRef.current.facing = 'left';
      } else {
        playerRef.current.finAngle = Math.sin(timeSec * 4) * 0.15;
      }

      // Bound player
      playerRef.current.x = Math.max(50, Math.min(width - 50, playerRef.current.x));
      playerRef.current.y = Math.max(60, Math.min(height - 110, playerRef.current.y));

      // WATER TORPEDO SHOOTING [SPACEBAR]
      if (keys.has(' ') && playerRef.current.waterSprayCooldown <= 0) {
        playerRef.current.waterSprayCooldown = 0.28;
        soundEngine.playWaterSpray();

        const dir = playerRef.current.facing === 'right' ? 1 : -1;
        waterStreamsRef.current.push({
          x: playerRef.current.x + dir * 30,
          y: playerRef.current.y - 2,
          vx: dir * 520,
          vy: (Math.random() - 0.5) * 50,
          life: 1.2,
        });

        // Small propulsion recoil
        particlesRef.current.push({
          x: playerRef.current.x - dir * 20,
          y: playerRef.current.y,
          vx: -dir * 80,
          vy: (Math.random() - 0.5) * 40,
          color: '#38bdf8',
          life: 0.4,
          size: 3,
        });
      }
      if (playerRef.current.waterSprayCooldown > 0) {
        playerRef.current.waterSprayCooldown -= dt;
      }

      // ECO-MAGNET ATTRACTION (Nearby matching trash sucked in)
      trashItemsRef.current.forEach(trash => {
        const dist = Math.hypot(trash.x - playerRef.current.x, trash.y - playerRef.current.y);

        // Suction towards player
        if (
          carriedItemsRef.current.length > 0 &&
          carriedItemsRef.current.length < maxStack &&
          trash.type === carriedItemsRef.current[0].type &&
          dist < 130
        ) {
          const pullAngle = Math.atan2(
            playerRef.current.y - trash.y,
            playerRef.current.x - trash.x
          );
          trash.x += Math.cos(pullAngle) * 200 * dt;
          trash.y += Math.sin(pullAngle) * 200 * dt;
        }

        // Pickup collision
        if (dist < 48) {
          if (carriedItemsRef.current.length === 0) {
            carriedItemsRef.current = [trash];
            trashItemsRef.current = trashItemsRef.current.filter(t => t.id !== trash.id);
            soundEngine.playClick();
            setCarriedCount(1);
            setCarriedTypeName(trash.name);
            setStatusMessage(`¡LLEVAS [1 / ${maxStack}] ${trash.name}! Clasifícalo en su caneca.`);
          } else if (
            carriedItemsRef.current.length < maxStack &&
            carriedItemsRef.current[0].type === trash.type
          ) {
            carriedItemsRef.current.push(trash);
            trashItemsRef.current = trashItemsRef.current.filter(t => t.id !== trash.id);
            soundEngine.playClick();
            setCarriedCount(carriedItemsRef.current.length);
            setStatusMessage(
              `¡IMÁN ECO! [${carriedItemsRef.current.length} / ${maxStack}] ${trash.name} acumulados.`
            );
          }
        }
      });

      // TIME GRENADES COLLISION (+5s / -5s)
      grenadesRef.current.forEach(g => {
        if (!g.collected) {
          const dist = Math.hypot(g.x - playerRef.current.x, g.y - playerRef.current.y);
          if (dist < 40) {
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

      // DEPOSIT INTO 50% LARGER BINS
      if (carriedItemsRef.current.length > 0) {
        binsRef.current.forEach(bin => {
          const dist = Math.hypot(bin.x - playerRef.current.x, bin.y - playerRef.current.y);
          if (dist < 75) {
            depositCarriedTrash(bin);
          }
        });
      }

      // WATER TORPEDOES VS VILLAIN & INTERACTABLES
      for (let i = waterStreamsRef.current.length - 1; i >= 0; i--) {
        const stream = waterStreamsRef.current[i];
        stream.x += stream.vx * dt;
        stream.y += stream.vy * dt;
        stream.life -= dt;

        // Hit villain with water torpedo!
        if (!villainDefeatedRef.current) {
          const distVillain = Math.hypot(
            stream.x - villainRef.current.x,
            stream.y - villainRef.current.y
          );
          if (distVillain < 55 * villainRef.current.sizeScale) {
            stream.life = 0;
            soundEngine.playRecycleSuccess();

            // Villain stunned & loses HP
            villainRef.current.stunTimer = 1.2;
            villainHpRef.current = Math.max(0, villainHpRef.current - 15);
            setVillainHp(villainHpRef.current);

            // Water hit splash particles
            for (let p = 0; p < 6; p++) {
              particlesRef.current.push({
                x: villainRef.current.x,
                y: villainRef.current.y,
                vx: (Math.random() - 0.5) * 160,
                vy: (Math.random() - 0.5) * 160,
                color: '#38bdf8',
                life: 0.5,
                size: 4,
              });
            }

            if (villainHpRef.current <= 0) {
              villainDefeatedRef.current = true;
              setVillainDefeated(true);
              soundEngine.play7_MiMotivacion();
              setStatusMessage(
                `¡VILLANO ${level.villainInfo.name} DERROTADO Y PURIFICADO! +500 PTS 💫`
              );
            }
          }
        }

        // Friendly monsters in Level 4
        if (level.specialMechanic === 'friendly_monsters') {
          parkMonstersRef.current.forEach(m => {
            if (!m.isFriendly) {
              const dm = Math.hypot(stream.x - m.x, stream.y - m.y);
              if (dm < 45) {
                m.hp -= 30;
                stream.life = 0;
                if (m.hp <= 0) {
                  m.isFriendly = true;
                  setFriendlyMonstersCount(prev => prev + 1);
                  soundEngine.play7_MiMotivacion();
                  setStatusMessage('¡Monstruo purificado! Ahora te ayuda.');
                }
              }
            }
          });
        }

        if (stream.life <= 0) {
          waterStreamsRef.current.splice(i, 1);
        }
      }

      // VILLAIN AI (Moves when not stunned, vomits ONLY if trash < 5)
      const vDist = Math.hypot(
        villainRef.current.x - playerRef.current.x,
        villainRef.current.y - playerRef.current.y
      );
      villainDistanceRef.current = Math.round(vDist / 10);

      const isClose = vDist < 190 && !villainDefeatedRef.current;
      proximityAlertRef.current = isClose;

      // Update UI distance / alert throttled (every 400ms) to prevent re-render lag
      uiTicker += dt;
      if (uiTicker > 0.4) {
        uiTicker = 0;
        setVillainDistance(villainDistanceRef.current);
        setProximityAlert(proximityAlertRef.current);
      }

      if (!villainDefeatedRef.current) {
        const v = villainRef.current;

        if (v.stunTimer > 0) {
          v.stunTimer -= dt;
        } else {
          v.x += v.vx;
          v.y += v.vy;

          if (v.x < 90 || v.x > width - 90) v.vx *= -1;
          if (v.y < 80 || v.y > height - 140) v.vy *= -1;
        }

        // Vomit trash ONLY when trash count is low (< 5), keeping screen clean!
        v.vomitTimer += dt;
        if (v.vomitTimer >= 9 && trashItemsRef.current.length < 5) {
          v.vomitTimer = 0;
          soundEngine.playBasuroteVomit();
          trashItemsRef.current.push(spawnSingleTrash());
          pollutionBarRef.current = Math.min(100, pollutionBarRef.current + 3);
          setPollutionBar(pollutionBarRef.current);
        }
      }

      // -----------------------------------------------------------------
      // DRAW CANVAS (OPTIMIZED 2D RENDERING)
      // -----------------------------------------------------------------

      // A) Thematic Environment
      drawEnvironment2D(ctx, width, height, level, timeSec);

      // B) 50% Larger Bins
      drawBins2D(
        ctx,
        binsRef.current,
        level.number >= 5,
        timeSec,
        carriedItemsRef.current[0]?.type
      );

      // C) Special Mechanics
      drawMechanics2D(ctx, level, timeSec, {
        airButtons: airButtonsRef.current,
        parkMonsters: parkMonstersRef.current,
        soilSpots: soilSpotsRef.current,
        toxicBarrels: toxicBarrelsRef.current,
        sharks: sharksRef.current,
        dinoNests: dinoNestsRef.current,
        dragonEggRescued,
      });

      // D) Time Grenades
      grenadesRef.current.forEach(g => {
        if (!g.collected) {
          drawTimeGrenade2D(ctx, g, timeSec);
        }
      });

      // E) PROXIMITY RADAR TETHER (when villain is close, drawn on canvas)
      if (proximityAlertRef.current) {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(playerRef.current.x, playerRef.current.y);
        ctx.lineTo(villainRef.current.x, villainRef.current.y);
        ctx.strokeStyle = `rgba(244, 63, 94, ${0.4 + Math.sin(timeSec * 10) * 0.3})`;
        ctx.lineWidth = 2.5;
        ctx.setLineDash([8, 6]);
        ctx.stroke();

        // Pulsing warning circle on player
        ctx.beginPath();
        ctx.arc(playerRef.current.x, playerRef.current.y, 45 + Math.sin(timeSec * 8) * 8, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
      }

      // F) CLEAN COLLECTIBLE TRASH TOKENS (NO NAMES / NO FLOATING LABELS!)
      trashItemsRef.current.forEach((trash, idx) => {
        const d = Math.hypot(trash.x - playerRef.current.x, trash.y - playerRef.current.y);
        drawCleanTrashToken2D(ctx, trash, timeSec, idx, d < 65);
      });

      // G) Water Torpedo Streams
      waterStreamsRef.current.forEach(ws => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(ws.x, ws.y, 7, 0, Math.PI * 2);
        ctx.fillStyle = '#38bdf8';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#38bdf8';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(ws.x - 2, ws.y - 2, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.restore();
      });

      // H) UNIQUE BOSS VILLAIN (HIGH VISIBILITY: 50% LARGER, SMOG VORTEX, BOSS BAR)
      drawHighVisibilityVillain2D(
        ctx,
        level.villainInfo,
        villainRef.current,
        timeSec,
        villainHpRef.current,
        villainDefeatedRef.current
      );

      // I) BUCEADOR DIVER CHARACTER (HIGH VISIBILITY: RADIANT AURA, BIGGER SPRITE, ARROW)
      drawHighVisibilityDiver2D(
        ctx,
        playerRef.current,
        level.diverSuit,
        timeSec,
        carriedItemsRef.current,
        maxStack,
        dragon
      );

      // Ambient bubbles
      bubblesRef.current.forEach(b => {
        b.y -= b.vy;
        if (b.y < 20) b.y = 560;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fill();
      });

      // Particles
      for (let p = particlesRef.current.length - 1; p >= 0; p--) {
        const pt = particlesRef.current[p];
        pt.x += pt.vx * dt;
        pt.y += pt.vy * dt;
        pt.life -= dt;
        if (pt.life <= 0) {
          particlesRef.current.splice(p, 1);
          continue;
        }
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
        ctx.fillStyle = pt.color;
        ctx.fill();
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [
    level,
    avatar,
    maxStack,
    depositCarriedTrash,
    spawnSingleTrash,
    dragon,
  ]);

  return (
    <div className="flex flex-col items-center w-full max-w-5xl mx-auto space-y-3">
      {/* Top HUD Bar */}
      <div className="w-full bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-3xl p-3.5 shadow-xl flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Level, Environment & Diver Suit */}
        <div className="flex items-center gap-2.5">
          <div className="px-3 py-1.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-black text-sm">
            Nivel {level.number}
          </div>
          <div>
            <h2 className="font-fun text-sm font-bold text-white flex items-center gap-1.5">
              <span>{level.title}</span>
              <span className="text-[10px] text-cyan-400 bg-cyan-950/50 px-2 py-0.5 rounded-full border border-cyan-500/30">
                {level.diverSuit.suitName} (+{level.diverSuit.bonusSpeed} Vel)
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
          <span>
            {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
          </span>
        </div>

        {/* Cleaned Goal */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 font-bold">
          <Award className="w-4 h-4 text-emerald-400" />
          <span>
            Meta: {trashCleanedCount} / {level.requiredTrashToWin}
          </span>
        </div>

        {/* Villain HP Status */}
        <div className="flex items-center gap-2 bg-slate-950/80 border border-rose-500/40 px-3 py-1 rounded-2xl">
          <span className="text-xl">{level.villainInfo.avatar}</span>
          <div>
            <div className="flex justify-between text-[10px] font-bold">
              <span className="text-rose-400">{level.villainInfo.name}:</span>
              <span className={villainDefeated ? 'text-emerald-400' : 'text-rose-300'}>
                {villainDefeated ? '¡INMÓVIL!' : `${villainHp} HP`}
              </span>
            </div>
            <div className="w-20 bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full transition-all ${
                  villainDefeated ? 'bg-emerald-400' : 'bg-rose-500'
                }`}
                style={{ width: `${(villainHp / level.villainInfo.maxHp) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Eco-Magnet Container Status */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-2xl bg-purple-950/40 border border-purple-500/40 text-purple-300 font-bold text-[11px]">
          <Magnet className="w-3.5 h-3.5 text-purple-400" />
          <span>
            Imán: [{carriedCount} / {maxStack}] {carriedTypeName}
          </span>
        </div>

        {/* Water Torpedo Ammo */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 font-bold text-[11px]">
          <Droplets className="w-3.5 h-3.5" />
          <span>Torpedos: [ESPACIO]</span>
        </div>
      </div>

      {/* Main 2D Viewport (60 FPS Locked Canvas) */}
      <div className="relative w-full aspect-[4/3] max-h-[580px] rounded-3xl overflow-hidden border-2 border-slate-800 shadow-2xl bg-slate-950">
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="w-full h-full object-contain cursor-crosshair"
          onClick={handleCanvasClick}
        />

        {/* Proximity Alert Warning Screen Banner */}
        {proximityAlert && (
          <div className="absolute top-12 left-1/2 -translate-x-1/2 pointer-events-none">
            <div className="bg-rose-950/95 border-2 border-rose-500 text-rose-200 px-5 py-2 rounded-full font-black text-xs tracking-wider shadow-2xl flex items-center gap-2 animate-bounce">
              <AlertTriangle className="w-4 h-4 text-rose-400 animate-spin" />
              <span>
                ⚠️ ¡VILLANO CERCA! ({villainDistance}m) — ¡DISPARA CON [ESPACIO]! ⚠️
              </span>
            </div>
          </div>
        )}

        {/* Time Grenade Pop-Up Notification */}
        {timeFlash && (
          <div className="absolute top-24 left-1/2 -translate-x-1/2 bg-slate-900/95 border border-slate-700 px-5 py-2 rounded-2xl font-black text-sm shadow-2xl animate-bounce">
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

// ----------------------------------------------------------------------------------
// 2D DRAWING ENGINES: HIGH VISIBILITY DIVER, HIGH VISIBILITY BOSS, CLEAN TOKENS
// ----------------------------------------------------------------------------------

// 1. BUCEADOR DIVER (HIGH VISIBILITY: 40% LARGER, RADIANT GROUND AURA, ARROW & TAG)
function drawHighVisibilityDiver2D(
  ctx: CanvasRenderingContext2D,
  player: { x: number; y: number; facing: string; finAngle: number },
  suit: LevelConfig['diverSuit'],
  time: number,
  carried: TrashItem[],
  maxStack: number,
  dragon: DragonPet
) {
  ctx.save();
  ctx.translate(player.x, player.y);

  // A) RADIANT GROUND AURA HALO (Pulsating neon beacon ensures 100% visibility on ANY background!)
  const pulse = Math.sin(time * 6) * 4;
  const haloGrad = ctx.createRadialGradient(0, 8, 8, 0, 8, 38 + pulse);
  haloGrad.addColorStop(0, 'rgba(56, 189, 248, 0.45)');
  haloGrad.addColorStop(0.7, 'rgba(16, 185, 129, 0.2)');
  haloGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');

  ctx.fillStyle = haloGrad;
  ctx.beginPath();
  ctx.arc(0, 8, 38 + pulse, 0, Math.PI * 2);
  ctx.fill();

  // Halo outer crisp neon ring
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.arc(0, 8, 34 + pulse * 0.5, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // B) PLAYER FLOATING TAG ABOVE HEAD: "⭐️ TÚ"
  ctx.save();
  ctx.fillStyle = '#090d16';
  ctx.beginPath();
  ctx.roundRect(-30, -56, 60, 18, 9);
  ctx.fill();
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 1.8;
  ctx.stroke();

  ctx.font = 'black 10px sans-serif';
  ctx.fillStyle = '#38bdf8';
  ctx.textAlign = 'center';
  ctx.fillText('⭐️ TÚ', 0, -43);

  // Tiny pointer triangle
  ctx.fillStyle = '#38bdf8';
  ctx.beginPath();
  ctx.moveTo(-4, -38);
  ctx.lineTo(4, -38);
  ctx.lineTo(0, -34);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // C) FLIP FOR FACING DIRECTION
  if (player.facing === 'left') {
    ctx.scale(-1, 1);
  }

  // Hydro-Cannon Laser Targeting Beam
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(35, 0);
  ctx.lineTo(85, 0);
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 4]);
  ctx.stroke();
  ctx.restore();

  // Headlight cone beam radiating forward
  const lightGrad = ctx.createRadialGradient(30, 0, 5, 140, 0, 120);
  lightGrad.addColorStop(0, 'rgba(255, 255, 255, 0.5)');
  lightGrad.addColorStop(0.5, 'rgba(56, 189, 248, 0.22)');
  lightGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
  ctx.fillStyle = lightGrad;
  ctx.beginPath();
  ctx.moveTo(25, -6);
  ctx.lineTo(140, -50);
  ctx.lineTo(140, 50);
  ctx.closePath();
  ctx.fill();

  // Scale up character by 35% for bold presence
  ctx.scale(1.35, 1.35);

  // Twin Oxygen Scuba Tanks on Back
  ctx.fillStyle = suit.tankColor;
  ctx.beginPath();
  ctx.roundRect(-22, -18, 13, 36, 5);
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#0f172a';
  ctx.stroke();

  // Wetsuit Torso
  ctx.fillStyle = suit.suitColor;
  ctx.beginPath();
  ctx.roundRect(-10, -15, 24, 30, 8);
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = '#ffffff';
  ctx.stroke();

  // Diving Fins / Flippers with active kick
  ctx.save();
  ctx.translate(-14, 15);
  ctx.rotate(player.finAngle);
  ctx.fillStyle = suit.tankColor;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-16, 9);
  ctx.lineTo(-20, 18);
  ctx.lineTo(-4, 11);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();

  // Scuba Helmet & Mask
  ctx.fillStyle = suit.accentColor;
  ctx.beginPath();
  ctx.arc(8, -13, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Reflective Visor Glass
  ctx.fillStyle = suit.visorColor;
  ctx.beginPath();
  ctx.roundRect(10, -18, 12, 11, 4);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(13, -16, 4, 3); // Glint

  // Hydro-Torpedo Blaster in hand
  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(12, -2, 24, 6);
  ctx.fillStyle = '#0284c7';
  ctx.fillRect(16, 3, 5, 7);

  // Air bubbles rising from regulator
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.beginPath();
  ctx.arc(4, -24 - ((time * 24) % 18), 3, 0, Math.PI * 2);
  ctx.arc(2, -36 - ((time * 24) % 18), 4, 0, Math.PI * 2);
  ctx.fill();

  // Carried Eco-Magnet item indicator
  if (carried.length > 0) {
    const meta = TRASH_META[carried[0].type];
    ctx.save();
    if (player.facing === 'left') ctx.scale(-1, 1);

    ctx.fillStyle = '#090d16';
    ctx.beginPath();
    ctx.roundRect(-24, -46, 48, 22, 10);
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = meta.glowColor;
    ctx.stroke();

    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(carried[0].icon, -8, -30);

    ctx.font = 'bold 11px sans-serif';
    ctx.fillStyle = '#fde68a';
    ctx.fillText(`x${carried.length}`, 12, -30);
    ctx.restore();
  }

  // Accompanying Dragon if hatched
  if (dragon.unlocked && dragon.isHatched) {
    const dIcon = dragon.stage === 'titan' ? '👑🐉' : dragon.stage === 'juvenil' ? '🐉' : '🐲';
    ctx.font = '28px sans-serif';
    ctx.fillText(dIcon, -38, -22);
  }

  ctx.restore();
}

// 2. BOSS VILLAIN (HIGH VISIBILITY: 50% LARGER, OOZE/SMOG VORTEX, BOSS BAR)
function drawHighVisibilityVillain2D(
  ctx: CanvasRenderingContext2D,
  info: LevelConfig['villainInfo'],
  v: { x: number; y: number; sizeScale: number; stunTimer: number },
  time: number,
  hp: number,
  isDefeated: boolean
) {
  ctx.save();
  ctx.translate(v.x, v.y);

  if (isDefeated) {
    // CRYSTALLIZED / PURIFIED STATUE (IMMOBILIZED!)
    ctx.font = '64px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🗿✨', 0, 0);

    ctx.font = '22px sans-serif';
    ctx.fillText('💫💫💫', 0, -48);

    ctx.fillStyle = '#064e3b';
    ctx.beginPath();
    ctx.roundRect(-60, 32, 120, 20, 10);
    ctx.fill();
    ctx.strokeStyle = '#34d399';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.font = 'bold 10px sans-serif';
    ctx.fillStyle = '#34d399';
    ctx.fillText('¡VILLANO PURIFICADO!', 0, 46);
  } else {
    // A) OOZE & SMOG DANGER VORTEX (Swirling purple/crimson danger aura)
    const dangerPulse = Math.sin(time * 8) * 8;
    const auraGrad = ctx.createRadialGradient(0, 0, 15, 0, 0, 58 + dangerPulse);
    auraGrad.addColorStop(0, 'rgba(159, 18, 57, 0.6)');
    auraGrad.addColorStop(0.6, 'rgba(88, 28, 135, 0.35)');
    auraGrad.addColorStop(1, 'rgba(15, 23, 42, 0)');

    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 58 + dangerPulse, 0, Math.PI * 2);
    ctx.fill();

    // Stunned indicator if recently hit with water
    if (v.stunTimer > 0) {
      ctx.font = '22px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('💫❄️💫', 0, -56);
    }

    // B) BIG MENACING VILLAIN SPRITE (72px emoji!)
    const squish = Math.sin(time * 6) * 4;
    ctx.font = '68px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(info.avatar, 0, squish);

    // C) PROMINENT BOSS HP BAR FLOATING OVER HEAD
    ctx.save();
    // Name banner
    ctx.fillStyle = '#020617';
    ctx.beginPath();
    ctx.roundRect(-55, -64, 110, 16, 8);
    ctx.fill();
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.font = 'black 9px sans-serif';
    ctx.fillStyle = '#fca5a5';
    ctx.textAlign = 'center';
    ctx.fillText(`☠️ ${info.name.slice(0, 16)}`, 0, -53);

    // HP Bar background
    ctx.fillStyle = '#090d16';
    ctx.beginPath();
    ctx.roundRect(-45, -46, 90, 9, 4);
    ctx.fill();

    // HP Bar fill
    const hpRatio = Math.max(0, hp / info.maxHp);
    ctx.fillStyle = hpRatio > 0.3 ? '#ef4444' : '#f97316';
    ctx.beginPath();
    ctx.roundRect(-44, -45, 88 * hpRatio, 7, 3);
    ctx.fill();

    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1;
    ctx.strokeRect(-45, -46, 90, 9);
    ctx.restore();
  }

  ctx.restore();
}

// 3. CLEAN COLLECTIBLE TRASH TOKENS (ZERO TEXT LABELS / NO NAMES / NO SCREEN CLUTTER)
function drawCleanTrashToken2D(
  ctx: CanvasRenderingContext2D,
  trash: TrashItem,
  time: number,
  idx: number,
  isNear: boolean
) {
  const meta = TRASH_META[trash.type] || TRASH_META.organico;
  const bob = Math.sin(time * 3.5 + idx * 1.6) * 5;

  ctx.save();
  ctx.translate(trash.x, trash.y + bob);

  // Soft glowing aura circle
  const glowGrad = ctx.createRadialGradient(0, 0, 6, 0, 0, isNear ? 28 : 22);
  glowGrad.addColorStop(0, meta.glowColor + '55');
  glowGrad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glowGrad;
  ctx.beginPath();
  ctx.arc(0, 0, isNear ? 28 : 22, 0, Math.PI * 2);
  ctx.fill();

  // High contrast circular pod
  ctx.fillStyle = meta.bgColor;
  ctx.beginPath();
  ctx.arc(0, 0, 18, 0, Math.PI * 2);
  ctx.fill();

  // Colored neon border
  ctx.lineWidth = isNear ? 3 : 2;
  ctx.strokeStyle = isNear ? '#fde68a' : meta.borderColor;
  ctx.stroke();

  // Big, clean emoji icon (30px)
  ctx.font = '26px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(trash.icon, 0, 1);

  // If player is close, draw clean pulsing magnetic suction ring (NO TEXT!)
  if (isNear) {
    ctx.strokeStyle = '#fde68a';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.arc(0, 0, 24, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  ctx.restore();
}

// 4. DRAW 50% LARGER BINS
function drawBins2D(
  ctx: CanvasRenderingContext2D,
  bins: BinTarget[],
  showAllSeven: boolean,
  time: number,
  carryingType?: TrashItem['type']
) {
  const binWidth = showAllSeven ? 68 : 86;
  const binHeight = showAllSeven ? 64 : 74;

  bins.forEach(bin => {
    const isMatching = carryingType && bin.type === carryingType;
    const meta = TRASH_META[bin.type] || TRASH_META.organico;

    ctx.save();
    ctx.translate(bin.x, bin.y);

    // Glowing beacon when matching carried item
    if (isMatching) {
      ctx.beginPath();
      ctx.roundRect(-binWidth / 2 - 8, -binHeight / 2 - 14, binWidth + 16, binHeight + 22, 16);
      ctx.fillStyle = meta.glowColor + '33';
      ctx.shadowBlur = 18;
      ctx.shadowColor = meta.glowColor;
      ctx.fill();

      // Bouncing pointer arrow
      const arrowY = Math.sin(time * 8) * 4;
      ctx.font = 'bold 12px sans-serif';
      ctx.fillStyle = '#fde68a';
      ctx.textAlign = 'center';
      ctx.fillText(`⬇️ ¡AQUÍ [${bin.keyNumber}]!`, 0, -binHeight / 2 - 18 + arrowY);
    }

    // Bin Body
    ctx.fillStyle = bin.color;
    ctx.beginPath();
    ctx.roundRect(-binWidth / 2, -binHeight / 2, binWidth, binHeight, [6, 6, 14, 14]);
    ctx.fill();
    ctx.lineWidth = isMatching ? 3 : 2;
    ctx.strokeStyle = isMatching ? '#fde68a' : '#0f172a';
    ctx.stroke();

    // Bin Lid
    ctx.fillStyle = '#334155';
    ctx.fillRect(-binWidth / 2 - 4, -binHeight / 2 - 10, binWidth + 8, 12);
    ctx.strokeRect(-binWidth / 2 - 4, -binHeight / 2 - 10, binWidth + 8, 12);

    // Key Button: [ 1 ]
    ctx.fillStyle = '#090d16';
    ctx.beginPath();
    ctx.roundRect(-16, -binHeight / 2 + 5, 32, 16, 6);
    ctx.fill();
    ctx.font = 'bold 11px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(`[${bin.keyNumber}]`, 0, -binHeight / 2 + 17);

    // Recycling symbol
    ctx.font = '16px sans-serif';
    ctx.fillText('♻️', 0, 7);

    // Category Label
    ctx.font = 'bold 8px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(meta.label.slice(0, 9), 0, binHeight / 2 - 7);

    ctx.restore();
  });
}

// 5. DRAW TIME GRENADES (+5s / -5s)
function drawTimeGrenade2D(ctx: CanvasRenderingContext2D, g: TimeGrenade, time: number) {
  ctx.save();
  const floatY = Math.sin(time * 5 + g.x) * 4;
  ctx.translate(g.x, g.y + floatY);

  const isBonus = g.type === 'bonus';
  ctx.beginPath();
  ctx.arc(0, 0, 16, 0, Math.PI * 2);
  ctx.fillStyle = isBonus ? 'rgba(16, 185, 129, 0.35)' : 'rgba(239, 68, 68, 0.35)';
  ctx.shadowBlur = 10;
  ctx.shadowColor = isBonus ? '#10b981' : '#ef4444';
  ctx.fill();

  ctx.font = '22px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(isBonus ? '⏱️' : '💣', 0, 0);

  ctx.font = 'bold 10px sans-serif';
  ctx.fillStyle = isBonus ? '#34d399' : '#f87171';
  ctx.fillText(isBonus ? '+5s' : '-5s', 0, 20);

  ctx.restore();
}

// 6. DRAW THEMATIC ENVIRONMENTS (ALL 10 LEVELS)
function drawEnvironment2D(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  level: LevelConfig,
  time: number
) {
  switch (level.theme) {
    case 'sirena': {
      // 1. FONDO DE PARQUE OCEANICO ESTILO SIRENA
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#0284c7');
      grad.addColorStop(0.5, '#0ea5e9');
      grad.addColorStop(1, '#064e3b');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      ctx.font = '36px sans-serif';
      ctx.fillText('🧜‍♀️', 80, 85);
      ctx.fillText('🏰', 400, 75);
      ctx.fillText('🐠', (time * 50) % w, 140);
      break;
    }
    case 'mar': {
      // 2. FONDO DE MAR
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#0c4a6e');
      grad.addColorStop(0.6, '#0369a1');
      grad.addColorStop(1, '#082f49');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      ctx.font = '36px sans-serif';
      ctx.fillText('🌊', 80, 80);
      ctx.fillText('🚢', 680, 75);
      ctx.fillText('🐟', (w - (time * 60) % w), 160);
      break;
    }
    case 'monstruos': {
      // 3. FONDO DE MONSTRUOS
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#1e1b4b');
      grad.addColorStop(0.5, '#312e81');
      grad.addColorStop(1, '#1e293b');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      ctx.font = '36px sans-serif';
      ctx.fillText('🏭', 90, 80);
      ctx.fillText('💨', 400, 70);
      ctx.fillText('👾', 690, 80);
      break;
    }
    case 'vampiros': {
      // 4. FONDO DE VAMPIROS
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#2e1065');
      grad.addColorStop(0.5, '#3b0764');
      grad.addColorStop(1, '#090514');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      ctx.font = '36px sans-serif';
      ctx.fillText('🦇', 100, 80);
      ctx.fillText('🏰', 400, 70);
      ctx.fillText('🌕', 680, 75);
      break;
    }
    case 'dragones': {
      // 5. FONDO DE DRAGONES
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#7f1d1d');
      grad.addColorStop(0.5, '#991b1b');
      grad.addColorStop(1, '#450a0a');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Magma river
      ctx.fillStyle = '#ea580c';
      ctx.fillRect(0, 440, w, 28);
      ctx.font = '38px sans-serif';
      ctx.fillText('🌋', 670, 80);
      ctx.fillText('🔥', 120, 80);
      break;
    }
    case 'diablitos': {
      // 6. FONDO DE DIABLITOS (DESIERTO TOXICO)
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#78350f');
      grad.addColorStop(0.5, '#b45309');
      grad.addColorStop(1, '#451a03');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Dunes
      ctx.fillStyle = '#92400e';
      ctx.beginPath();
      ctx.moveTo(0, 240);
      ctx.quadraticCurveTo(200, 180, 400, 240);
      ctx.quadraticCurveTo(600, 300, w, 220);
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.fill();

      ctx.font = '34px sans-serif';
      ctx.fillText('🌵', 120, 160);
      ctx.fillText('🌵', 680, 190);
      ctx.fillText('☀️', 400, 60);
      break;
    }
    case 'zombies': {
      // 7. ZOMBIES (ESTACIÓN METRO MEDELLÍN)
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#064e3b');
      grad.addColorStop(0.5, '#022c22');
      grad.addColorStop(1, '#0f172a');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      ctx.font = '36px sans-serif';
      ctx.fillText('🚇', 110, 80);
      ctx.fillText('☣️', 400, 70);
      ctx.fillText('🏙️', 680, 80);
      break;
    }
    case 'tiburones': {
      // 8. TIBURONES CARNIBOROS
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#082f49');
      grad.addColorStop(0.5, '#0369a1');
      grad.addColorStop(1, '#020617');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      ctx.font = '36px sans-serif';
      ctx.fillText('🦈', 100, 80);
      ctx.fillText('⚠️', 400, 75);
      ctx.fillText('⚓', 680, 80);
      break;
    }
    case 'dinosaurios': {
      // 9. FONDO DE DINOSAURIOS (SELVA JURASICA)
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#14532d');
      grad.addColorStop(0.6, '#166534');
      grad.addColorStop(1, '#052e16');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      ctx.font = '40px sans-serif';
      ctx.fillText('🌴', 80, 85);
      ctx.fillText('🌴', 710, 85);
      ctx.fillText('🦕', 390, 75);
      break;
    }
    case 'planta_carnivora': {
      // 10. FONDO DE PLANTA CARNIVORA (SELVA MUTANTE)
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#3b0764');
      grad.addColorStop(0.5, '#581c87');
      grad.addColorStop(1, '#064e3b');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      ctx.font = '44px sans-serif';
      ctx.fillText('🌿', 90, 80);
      ctx.fillText('🥀', 700, 80);
      ctx.fillText('🪴', 390, 75);
      break;
    }
    default: {
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(1, '#1e293b');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    }
  }
}

// 7. DRAW SPECIAL MECHANICS
function drawMechanics2D(
  ctx: CanvasRenderingContext2D,
  level: LevelConfig,
  time: number,
  data: {
    airButtons: { x: number; y: number; activated: boolean }[];
    parkMonsters: { x: number; y: number; hp: number; isFriendly: boolean }[];
    soilSpots: { x: number; y: number; planted: boolean }[];
    toxicBarrels: { x: number; y: number; defused: boolean }[];
    sharks: { x: number; y: number; vx: number }[];
    dinoNests: { x: number; y: number; protected: boolean }[];
    dragonEggRescued: boolean;
  }
) {
  if (level.specialMechanic === 'air_buttons') {
    data.airButtons.forEach((btn, idx) => {
      ctx.beginPath();
      ctx.arc(btn.x, btn.y, 18, 0, Math.PI * 2);
      ctx.fillStyle = btn.activated ? '#10b981' : '#f59e0b';
      ctx.fill();
      ctx.font = 'bold 12px sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText(btn.activated ? '✓' : `F${idx + 1}`, btn.x, btn.y + 4);
    });
  }

  if (level.specialMechanic === 'friendly_monsters') {
    data.parkMonsters.forEach(m => {
      ctx.font = '36px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(m.isFriendly ? '🐸💚' : '👾💨', m.x, m.y);
    });
  }

  if (level.specialMechanic === 'diablitos_trees') {
    data.soilSpots.forEach(s => {
      ctx.font = '34px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(s.planted ? '🌳✨' : '🕳️', s.x, s.y);
    });
  }

  if (level.specialMechanic === 'shark_egg_rescue') {
    data.toxicBarrels.forEach(b => {
      ctx.font = '30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(b.defused ? '🛡️' : '☣️🛢️', b.x, b.y);
    });
    if (!data.dragonEggRescued) {
      ctx.font = '40px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🥚✨', 400, 260);
    }
  }

  if (level.specialMechanic === 'dino_nests') {
    data.dinoNests.forEach(n => {
      ctx.font = '34px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(n.protected ? '🛡️🪺' : '🪺🌧️', n.x, n.y);
    });
  }
}
