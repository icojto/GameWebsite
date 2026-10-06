import { gameStorage } from '../../shared/storage.mjs';
/** Site preferences are optional. Restricted storage must never stop rendering. */
export function createSafeStorage(getStorage = () => gameStorage) {
  return {
    get(key, fallback = null) {
      try { return getStorage().getItem(key) ?? fallback; }
      catch { return fallback; }
    },
    set(key, value) {
      try { getStorage().setItem(key, value); return true; }
      catch { return false; }
    },
    remove(key) {
      try { getStorage().removeItem(key); return true; }
      catch { return false; }
    },
  };
}

export const siteStorage = createSafeStorage();

export function readThemePreference(storage = siteStorage) {
  const current = storage.get('odesos.theme');
  if (current === 'light' || current === 'dark') return current;

  const legacy = storage.get('studioArcade.theme');
  if (legacy === 'light' || legacy === 'dark') {
    storage.set('odesos.theme', legacy);
    return legacy;
  }
  return null;
}
