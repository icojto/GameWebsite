/** Adapts logical keys; a failed QA operation can never address ordinary keys. */
export function scopedStorage(getStorage, session = null) {
  if (session !== null && !/^[a-zA-Z0-9_-]{8,64}$/.test(session)) throw new Error('Invalid storage session');
  const prefix = session ? `odesos.qa.${session}.` : '';
  const memory = new Map();
  let available = true;
  return {
    scope: prefix || 'ordinary origin storage',
    get available(){return available},
    getItem(key) { try { return getStorage().getItem(prefix + key) ?? memory.get(key) ?? null; } catch { available=false;return memory.get(key) ?? null; } },
    setItem(key, value) { memory.set(key, String(value)); try { getStorage().setItem(prefix + key, String(value)); } catch { available=false;/* isolated memory fallback */ } },
    removeItem(key) { memory.delete(key); try { getStorage().removeItem(prefix + key); } catch { available=false; /* optional storage */ } },
    resetSession() {
      if (!session) throw new Error('Session reset requires QA storage');
      memory.clear();
      const store = getStorage();
      const keys = Array.from({length:store.length}, (_, i) => store.key(i)).filter(key => key?.startsWith(prefix));
      for (const key of keys) store.removeItem(key);
    },
  };
}
