import type { ShopId } from '../data/gameData';

export interface Avatar {
  name: string;
  skin: string;
  hair: 'corto' | 'largo' | 'crespo' | 'coleta' | 'calvo';
  hairColor: string;
  shirt: string;
  accessory: ShopId | 'ninguno';
}

export interface Progress {
  version: 2;
  avatar: Avatar;
  coins: number;
  stars: Record<number, number>; // nivel -> estrellas (1..3)
  unlocked: number; // nivel máximo desbloqueado
  owned: ShopId[];
  answered: string[]; // preguntas respondidas correctamente
  hasDragon: boolean;
  tutorialSeen: boolean;
}

const KEY = 'mpm_progress_v2';

export const DEFAULT_PROGRESS: Progress = {
  version: 2,
  avatar: {
    name: '',
    skin: '#e0ac69',
    hair: 'corto',
    hairColor: '#3b2414',
    shirt: '#22c55e',
    accessory: 'ninguno',
  },
  coins: 50,
  stars: {},
  unlocked: 1,
  owned: [],
  answered: [],
  hasDragon: false,
  tutorialSeen: false,
};

export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return structuredClone(DEFAULT_PROGRESS);
    const data = JSON.parse(raw) as Partial<Progress>;
    if (data.version !== 2) return structuredClone(DEFAULT_PROGRESS);
    return {
      ...structuredClone(DEFAULT_PROGRESS),
      ...data,
      avatar: { ...DEFAULT_PROGRESS.avatar, ...(data.avatar ?? {}) },
    };
  } catch {
    return structuredClone(DEFAULT_PROGRESS);
  }
}

export function saveProgress(p: Progress) {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    // Modo incógnito o almacenamiento lleno: el juego sigue funcionando.
  }
}

export function resetProgress() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* noop */
  }
}

