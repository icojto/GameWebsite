export const MUTE_KEY = 'orbitBreak.audio.v1';
interface StoragePort { getItem(key: string): string | null; setItem(key: string, value: string): void }
export function loadMute(store: StoragePort): boolean {
  try { const entry = JSON.parse(store.getItem(MUTE_KEY) ?? 'null'); return entry?.version === 1 && typeof entry.mute === 'boolean' ? entry.mute : false; }
  catch { return false; }
}
export function saveMute(store: StoragePort, mute: boolean): void {
  try { store.setItem(MUTE_KEY, JSON.stringify({ version: 1, mute })); } catch { /* audio remains usable in memory */ }
}
