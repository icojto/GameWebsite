export const config = {
  gridWidth: 5, gridHeight: 6, initialCellCount: 6,
  initialTierWeights: [0.9, 0.1], spawnTierWeights: [0.9, 0.1],
  baseTurnHeat: 4, heatMaximum: 100, stabilityTarget: 100,
  mergeHeatReductionByTier: [0, 0, 2, 4, 6, 10],
  stabilityRewardByTier: [0, 0, 3, 6, 12, 24],
  scoreRewardByTier: [0, 0, 10, 30, 80, 200],
  moveDuration: 140, mergeDuration: 180, spawnDuration: 130,
  tierDefinitions: [
    { color: 0x59e3ec, name: 'ION' }, { color: 0xa18aff, name: 'FLUX' },
    { color: 0xf16fd0, name: 'PLASMA' }, { color: 0xffb365, name: 'FUSION' },
    { color: 0xf5ffff, name: 'CORE' },
  ],
} as const;
