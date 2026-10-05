import type { Placement } from './model.ts';
import type { AdService } from './service.ts';

/** Reviewed semantic boundaries. Designers may tune limits, never safeEvents. */
export const ORBIT_PLACEMENTS: readonly Placement[] = [
  { id: 'orbit.startup', gameId: 'orbit-break', adType: 'startup', enabled: true, cooldownSeconds: 0, maxPerSession: 1 },
  { id: 'orbit.play-interstitial', gameId: 'orbit-break', adType: 'interstitial', enabled: true, cooldownSeconds: 0, sessionLimitEnabled: false, maxPerSession: 100, safeEvents: ['play-requested'] },
  { id: 'orbit.restart-interstitial', gameId: 'orbit-break', adType: 'interstitial', enabled: true, cooldownSeconds: 0, sessionLimitEnabled: false, maxPerSession: 100, safeEvents: ['restart-requested'] },
  { id: 'orbit.revive', gameId: 'orbit-break', adType: 'rewarded', enabled: true, cooldownSeconds: 0, maxPerSession: 100, maxPerRun: 1 },
];

export function registerGamePlacements(service: AdService): void {
  for (const placement of [...ORBIT_PLACEMENTS, ...REACTOR_PLACEMENTS]) service.register(placement);
}

export const REACTOR_PLACEMENTS: readonly Placement[] = [
  { id: 'reactor.startup', gameId: 'reactor-stack', adType: 'startup', enabled: true, cooldownSeconds: 0, maxPerSession: 1 },
  { id: 'reactor.start-interstitial', gameId: 'reactor-stack', adType: 'interstitial', enabled: true, cooldownSeconds: 0, sessionLimitEnabled: false, maxPerSession: 3, safeEvents: ['start-requested'] },
  { id: 'reactor.pause-interstitial', gameId: 'reactor-stack', adType: 'interstitial', enabled: true, cooldownSeconds: 0, sessionLimitEnabled: false, maxPerSession: 3, safeEvents: ['pause-requested'] },
  { id: 'reactor.cool-refill', gameId: 'reactor-stack', adType: 'rewarded', enabled: true, cooldownSeconds: 0, maxPerSession: 10, maxPerRun: 1 },
  { id: 'reactor.upgrade-refill', gameId: 'reactor-stack', adType: 'rewarded', enabled: true, cooldownSeconds: 0, maxPerSession: 10, maxPerRun: 1 },
];
