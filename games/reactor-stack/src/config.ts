export type RuntimeConfig = {
  gridWidth: number; gridHeight: number; initialCellCount: number;
  initialTierWeights: number[]; spawnTierWeights: number[];
  baseTurnHeat: number; heatMaximum: number; heatWarningThreshold: number; stabilityTarget: number;
  mergeHeatReductionByTier: number[]; stabilityRewardByTier: number[]; scoreRewardByTier: number[];
  coolCoreUses: number; coolCoreAmount: number; upgradeUses: number; upgradeMaximumTier: number;
  moveDuration: number; mergeDuration: number; spawnDuration: number; sfxVolume: number;
  tierDefinitions: { color: number; name: string; short: string }[];
};

export const DEFAULT_CONFIG: Readonly<RuntimeConfig> = Object.freeze({
  gridWidth: 6, gridHeight: 6, initialCellCount: 6,
  initialTierWeights: [0.9, 0.1], spawnTierWeights: [0.9, 0.1],
  baseTurnHeat: 4, heatMaximum: 100, heatWarningThreshold: 80, stabilityTarget: 100,
  mergeHeatReductionByTier: [0, 0, 2, 4, 6, 10],
  stabilityRewardByTier: [0, 0, 3, 6, 12, 24],
  scoreRewardByTier: [0, 0, 10, 30, 80, 200],
  coolCoreUses: 1, coolCoreAmount: 25, upgradeUses: 1, upgradeMaximumTier: 4,
  moveDuration: 140, mergeDuration: 180, spawnDuration: 130, sfxVolume: 0.7,
  tierDefinitions: [
    { color: 0x39e9ed, name: 'ION', short: 'I' }, { color: 0x2789ff, name: 'FLUX', short: 'II' },
    { color: 0x925cff, name: 'PLASMA', short: 'III' }, { color: 0xef4cae, name: 'FUSION', short: 'IV' },
    { color: 0xffa33e, name: 'CORE', short: 'V' },
  ],
});

export function copyConfig(source: RuntimeConfig = DEFAULT_CONFIG): RuntimeConfig {
  return { ...source, initialTierWeights: [...source.initialTierWeights], spawnTierWeights: [...source.spawnTierWeights], mergeHeatReductionByTier: [...source.mergeHeatReductionByTier], stabilityRewardByTier: [...source.stabilityRewardByTier], scoreRewardByTier: [...source.scoreRewardByTier], tierDefinitions: source.tierDefinitions.map(tier => ({ ...tier })) };
}

export function clampConfig(config: RuntimeConfig): RuntimeConfig {
  config.gridWidth = Math.max(2, Math.min(10, Math.round(config.gridWidth))); config.gridHeight = Math.max(2, Math.min(10, Math.round(config.gridHeight)));
  config.initialCellCount = Math.max(0, Math.min(config.gridWidth * config.gridHeight, Math.round(config.initialCellCount)));
  config.heatMaximum = Math.max(1, Math.round(config.heatMaximum)); config.stabilityTarget = Math.max(1, Math.round(config.stabilityTarget));
  config.heatWarningThreshold = Math.max(0, Math.min(config.heatMaximum, Math.round(config.heatWarningThreshold)));
  config.coolCoreUses = Math.max(0, Math.round(config.coolCoreUses)); config.upgradeUses = Math.max(0, Math.round(config.upgradeUses));
  config.upgradeMaximumTier = Math.max(1, Math.min(4, Math.round(config.upgradeMaximumTier))); config.coolCoreAmount = Math.max(0, Math.round(config.coolCoreAmount)); config.sfxVolume = Math.max(0, Math.min(1, config.sfxVolume));
  return config;
}
