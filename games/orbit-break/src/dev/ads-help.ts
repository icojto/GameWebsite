import type { DevControl } from './DevPanel.ts';
export const ADS_HELP:Record<string,string>={
  'ads.runId':'Opaque identity of the current run. Revive keeps it; PLAY/RESTART creates a new one. Host run limits use this identity, not the displayed score.',
  'ads.used':'Whether Orbit consumed its one shown revive-ad attempt in this run. A shown skipped/failed ad consumes it without reward. New run resets the local allowance; host independently enforces one.',
  'ads.suspended':'Current ad suspension of game simulation/input/audio, separate from ordinary PAUSED state. It releases after terminal result, cancellation or watchdog.',
  'ads.bridge':'Whether the website handshake completed. Connection alone does not mean an ad is prepared, eligible or a revive is currently available.',
  'ads.capabilities':'Website availability hints for fullscreen/rewarded/startup and provider mode. Every real request is rechecked. These do not promise that the current run can revive.',
  'ads.result':'Last actual client result, including DEV previews. Completed alone is not evidence of a granted revive: a genuine matching shown rewarded completion is required. player-skip means no reward.',
  'ads.offerSeconds':'How long the revive decision remains after death. Higher gives more decision time; lower gives less. Pending ad flow freezes it. Applies at the next death.',
  'ads.protectionSeconds':'Collision protection after qualified revive. Higher gives a longer safety window; lower makes play vulnerable sooner. Applies on the next qualified revive.',
  'ads.attackDelaySeconds':'Extra delay added to the normal attack interval after qualified revive. Higher delays the next attack; lower brings it sooner. Does not change ad policy.',
  'ads.death':'Ends active play using the real death/offer path. No death interstitial is triggered. Can finalize and save a run if no revive offer is available; use a test profile.',
  'ads.resetUsed':'Clears only Orbit’s local used flag. Does not reset the website run cap, receipts, session history or score. Does not grant revive or show an ad.',
  'ads.why':'Opens the existing Why Ads explanation in the menu only. No ad, reward or game start. Unavailable outside menu or with the Null provider.',
};
export function orbitAdHelp(control:DevControl):string {
  const text=ADS_HELP[control.path];if(!text)throw new Error(`Missing Orbit ad help ${control.path}`);
  return text+(control.type==='number'?` Units: seconds. Default: ${control.baseline}; range: ${control.min}–${control.max}. Session-only DEV tuning; reload restores defaults and does not change saved profile.`:' This game document/page session only.');
}
