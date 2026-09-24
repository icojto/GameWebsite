export const GAME_CONFIG = {
  playerAngularSpeed: 2.2,
  orbitRadius: 0.28,
  minimumOrbitRadius: 86,
  maximumOrbitRadius: 260,
  playerRadius: 8,

  hazardSpeed: 205,
  maximumHazardSpeed: 340,
  hazardSize: 13,
  hazardSpawnInterval: 1800,
  minimumHazardSpawnInterval: 820,
  warningDuration: 900,
  hazardSpawnDistance: 110,
  maximumActiveHazards: 6,

  difficultyRampRate: 0.018,
  scoreRate: 10,
  inputDebounceMs: 90,
  maximumDeltaMs: 50,

  audioBpm: 118,
  audioMusicVolume: 0.12,
  audioSfxVolume: 0.22,
} as const;

export const COLORS = {
  background: 0x05070d,
  panel: 0x0a1020,
  cyan: 0x20e9ff,
  cyanSoft: 0x0a91ad,
  white: 0xf4fbff,
  magenta: 0xff2caa,
  magentaSoft: 0x7d164f,
  muted: '#7890a0',
  bright: '#f4fbff',
  cyanCss: '#20e9ff',
  magentaCss: '#ff2caa',
} as const;
