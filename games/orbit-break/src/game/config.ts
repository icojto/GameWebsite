export const FORMATIONS = ['single', 'double', 'arrow', 'line', 'bombardment'] as const;
export type FormationId = (typeof FORMATIONS)[number];

export interface FormationConfig {
  enabled: boolean;
  weight: number;
  weightByTier: number[];
  minimumTier: number;
  cooldownMs: number;
  maxConsecutive: number;
  count: number;
  intervalMs: number;
  arcRadians: number;
  speedMultiplier: number;
  arcMaximum?: number;
  minimumSeparation?: number;
  sweepDirection?: 1 | -1;
}

export interface GameConfig {
  playerAngularSpeed: number;
  orbitRadius: number;
  minimumOrbitRadius: number;
  maximumOrbitRadius: number;
  playerRadius: number;
  scoreRate: number;
  inputDebounceMs: number;
  maximumDeltaMs: number;
  difficulty: {
    initial: number; rampPerSecond: number; maximum: number; tierThresholds: number[];
    attackIntervalMaxMs: number; attackIntervalMinMs: number;
  };
  projectile: {
    speedMin: number; speedMax: number; size: number; spawnDistance: number;
    lifetimeMs: number; simultaneousLimit: number;
  };
  telegraph: {
    leadMs: number; minimumLeadMs: number; pingCount: number; pingIntervalMs: number;
    holdMs: number; opacity: number; scale: number; launchDelayMs: number;
  };
  formations: Record<FormationId, FormationConfig>;
  xp: { baseRequirement: number; growth: number; questsPerLevel: number; levelCap: number };
  economy: { baseStars: number; starsPerLevel: number; starCap: number };
  cosmetics: { waterPrice: number; naturePrice: number; firePrice: number; lightLevel: number; chaosLevel: number };
  audio: { bpm: number; musicVolume: number; sfxVolume: number };
}

export const DEFAULT_CONFIG: GameConfig = {
  playerAngularSpeed: 2.2, orbitRadius: 0.28, minimumOrbitRadius: 76,
  maximumOrbitRadius: 260, playerRadius: 8, scoreRate: 10,
  inputDebounceMs: 90, maximumDeltaMs: 50,
  difficulty: {
    initial: 1, rampPerSecond: 0.018, maximum: 5,
    tierThresholds: [1, 1.55, 2.25, 3.1, 4.05],
    attackIntervalMaxMs: 1800, attackIntervalMinMs: 850,
  },
  projectile: {
    speedMin: 205, speedMax: 340, size: 13, spawnDistance: 90,
    lifetimeMs: 5500, simultaneousLimit: 8,
  },
  telegraph: {
    leadMs: 900, minimumLeadMs: 650, pingCount: 2, pingIntervalMs: 240,
    holdMs: 250, opacity: 0.72, scale: 1, launchDelayMs: 0,
  },
  formations: {
    single: { enabled: true, weight: 7, weightByTier: [1, 0.9, 0.75, 0.62, 0.5], minimumTier: 1, cooldownMs: 0, maxConsecutive: 3, count: 1, intervalMs: 0, arcRadians: 0, speedMultiplier: 1 },
    double: { enabled: true, weight: 4, weightByTier: [0, 1, 1, 0.9, 0.85], minimumTier: 2, cooldownMs: 2200, maxConsecutive: 2, count: 2, intervalMs: 520, arcRadians: 0, speedMultiplier: 1 },
    arrow: { enabled: true, weight: 3, weightByTier: [0, 0, 1, 1.1, 1.1], minimumTier: 3, cooldownMs: 3000, maxConsecutive: 1, count: 3, intervalMs: 0, arcRadians: 0.66, speedMultiplier: 0.92 },
    line: { enabled: true, weight: 2.5, weightByTier: [0, 0, 0, 1, 1.15], minimumTier: 4, cooldownMs: 3500, maxConsecutive: 1, count: 4, intervalMs: 280, arcRadians: 0.9, speedMultiplier: 1, sweepDirection: 1 },
    bombardment: { enabled: true, weight: 1.3, weightByTier: [0, 0, 0, 0, 1.4], minimumTier: 5, cooldownMs: 7000, maxConsecutive: 1, count: 5, intervalMs: 350, arcRadians: Math.PI * 0.2, arcMaximum: Math.PI * 0.72, minimumSeparation: 0.19, speedMultiplier: 1.05 },
  },
  xp: { baseRequirement: 100, growth: 1.2, questsPerLevel: 5, levelCap: 10 },
  economy: { baseStars: 10, starsPerLevel: 5, starCap: 999999 },
  cosmetics: { waterPrice: 50, naturePrice: 300, firePrice: 900, lightLevel: 5, chaosLevel: 10 },
  audio: { bpm: 118, musicVolume: 0.12, sfxVolume: 0.22 },
};

export function createRuntimeConfig(): GameConfig {
  return structuredClone(DEFAULT_CONFIG);
}

export const COLORS = {
  background: 0x05070d, cyan: 0x20e9ff, white: 0xf4fbff,
  magenta: 0xff2caa, magentaSoft: 0x7d164f,
} as const;
