/** Exact public production keys. Hidden games and DEV/QA keys are excluded. */
export const publicLocalKeys = Object.freeze([
  'odesos.theme', 'studioArcade.theme',
  'odesos.player.reaction.orbit-break', 'odesos.player.reaction.reactor-stack',
  'orbitBreak.profile.v2', 'orbitBreak.bestScore', 'orbitBreak.audio.v1',
  'reactor-stack-scores', 'reactor-stack-best',
]);
export const hiddenLocalKeys = Object.freeze(['last-relay-v1', 'hs.game004.scenario', 'hristo.signal-below.checkpoint']);
/** The caller supplies scoped storage in an identified QA session; never enumerate an origin. */
export function clearPublicLocalData(storage) {
  const failed = [];
  for (const key of publicLocalKeys) {
    try { storage.removeItem(key); if (storage.getItem(key) !== null) failed.push(key); }
    catch { failed.push(key); }
  }
  return {ok: failed.length === 0 && storage.available !== false, failed};
}
