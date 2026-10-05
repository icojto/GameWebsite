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
  for (const placement of ORBIT_PLACEMENTS) service.register(placement);
}
