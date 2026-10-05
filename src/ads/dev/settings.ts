import { normalizeConfig } from '../model.ts';
import type { FullscreenType, Placement } from '../model.ts';
export const STORAGE_KEY = 'odesos.dev.ads.v1.1';
export function devPlacement(gameId:string,adType:FullscreenType,safeEvents:string[]):Placement {
  return {id:`dev-${gameId}-${adType}`,gameId,adType,enabled:true,cooldownSeconds:0,maxPerSession:100,sessionLimitEnabled:adType!=='interstitial',safeEvents:adType==='interstitial'?safeEvents:[]};
}
/** Keep the legacy finite value until the designer chooses. No game storage is read. */
export function loadDevSettings(value: unknown) {
  const config = normalizeConfig(value);
  const saved = value as { interstitial?: { maxPerSession?: unknown; sessionLimitEnabled?: unknown } } | null;
  const needsChoice = typeof saved?.interstitial?.maxPerSession === 'number'
    && saved.interstitial.sessionLimitEnabled === undefined;
  if (needsChoice) config.interstitial.sessionLimitEnabled = true;
  return { config, needsChoice };
}
