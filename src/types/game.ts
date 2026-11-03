export type Gender = 'chico' | 'chica';

export interface PlayerAvatar {
  gender: Gender;
  name: string;
  skinTone: string;
  hairStyle: string;
  hairColor: string;
  outfit: 'paisa_tradicional' | 'urbano_medellin' | 'superheroe_ecologico' | 'metro_conductor';
  accessory: 'sombrero_vueltiao' | 'carriel' | 'gafas_neon' | 'auriculares' | 'capa_verde' | 'ninguno';
  auraColor: string;
  speed: number;
}

export interface PlayerEconomy {
  coinsNormal: number; // Moneda Normal (Cobre paisa)
  coinsSuprema: number; // Moneda Suprema (Plata/Oro)
  coinsImposible: number; // Moneda Imposible (Diamante místico)
  gems: number; // Gemas ecológicas para eclosionar huevos
  score: number; // Puntos
  streak: number; // Racha de bailes/victorias
}

export interface CitizenID {
  level: number;
  rankTitle: string;
  issueDate: string;
  cardCode: string;
  treesPlanted: number;
  trashRecycled: number;
  honorBadge: string;
}

export interface DragonPet {
  unlocked: boolean;
  hasEgg: boolean;
  isHatched: boolean;
  name: string;
  type: 'fuego_paisa' | 'esmeralda_arvi' | 'aguacristal';
  stage: 'huevo' | 'bebe' | 'juvenil' | 'titan';
  incubationTimeRemaining: number; // in seconds
  hunger: number; // 0-100
  happiness: number; // 0-100
  level: number;
  power: number;
}

export interface HouseItem {
  id: string;
  name: string;
  cost: number;
  coinType: 'coinsNormal' | 'coinsSuprema' | 'coinsImposible';
  purchased: boolean;
  icon: string;
  bonus: string;
}

export interface House {
  id: string;
  name: string;
  unlocked: boolean;
  cost: number;
  type: 'casita_guayacan' | 'penthouse_poblado' | 'cabana_santa_elena';
  description: string;
  solarPanels: boolean;
  rainHarvest: boolean;
  ecoGarden: boolean;
  items: HouseItem[];
}

export interface ClanMember {
  id: string;
  name: string;
  role: string;
  unlockedAtLevel: number;
  isRecruited: boolean;
  cost: number;
  avatar: string;
  bonusDescription: string;
}

export interface Job {
  id: string;
  title: string;
  location: string;
  minLevel: number;
  salaryNormal: number;
  salarySuprema: number;
  cooldown: number; // seconds
  lastWorked: number;
  icon: string;
  description: string;
}

export interface ShopItem {
  id: string;
  name: string;
  category: 'poder' | 'accesorio' | 'herramienta' | 'incubadora';
  price: number;
  currency: 'coinsNormal' | 'coinsSuprema' | 'coinsImposible' | 'gems' | 'score';
  description: string;
  icon: string;
  effect: string;
  owned: boolean;
}

export interface NPCDialog {
  id: string;
  npcName: string;
  npcRole: string;
  avatar: string;
  location: string;
  situation: string;
  question: string;
  options: {
    text: string;
    isCorrect: boolean;
    explanation: string;
    rewardCoinsNormal?: number;
    rewardCoinsSuprema?: number;
    rewardGems?: number;
  }[];
}

export type LevelTheme =
  | 'sirena'
  | 'mar'
  | 'monstruos'
  | 'vampiros'
  | 'dragones'
  | 'diablitos'
  | 'zombies'
  | 'tiburones'
  | 'dinosaurios'
  | 'planta_carnivora';

export interface VillainInfo {
  name: string;
  title: string;
  avatar: string;
  color: string;
  secondaryColor: string;
  hp: number;
  maxHp: number;
  isDefeated: boolean;
  attackName: string;
}

export interface DiverSuit {
  suitName: string;
  suitColor: string;
  tankColor: string;
  visorColor: string;
  accentColor: string;
  description: string;
  bonusSpeed: number;
}

export interface TimeGrenade {
  id: string;
  type: 'bonus' | 'penalty'; // +5s or -5s
  x: number;
  y: number;
  z: number;
  collected: boolean;
}

export interface LevelConfig {
  number: number;
  title: string;
  theme: LevelTheme;
  backgroundName: string;
  missionDescription: string;
  durationSeconds: number;
  requiredTrashToWin: number;
  hasBasuroteVillain: boolean;
  villainInfo: VillainInfo;
  diverSuit: DiverSuit;
  environmentName: string;
  specialMechanic:
    | 'sorting_speed'
    | 'water_cleanup'
    | 'air_buttons'
    | 'friendly_monsters'
    | 'two_hooks_seven_bins'
    | 'diablitos_trees'
    | 'zombie_compost'
    | 'shark_egg_rescue'
    | 'dino_nests'
    | 'boss_titan_plant';
}

export interface TrashItem {
  id: string;
  x: number;
  y: number;
  z?: number;
  type: 'organico' | 'plastico' | 'papel' | 'vidrio' | 'peligroso' | 'chatarra' | 'quimico';
  name: string;
  icon: string;
  speedX?: number;
  speedY?: number;
  cleaned?: boolean;
}

export interface BinTarget {
  id: string;
  type: 'organico' | 'plastico' | 'papel' | 'vidrio' | 'peligroso' | 'chatarra' | 'quimico';
  name: string;
  color: string;
  x: number;
  y: number;
  z?: number;
  keyNumber: number;
}

