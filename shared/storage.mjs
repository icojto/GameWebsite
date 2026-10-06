import { scopedStorage } from './storage-scope.mjs';
// Vite folds the development branch away. Namespace selection precedes all reads.
const env = import.meta.env;
export const qaSession = env?.DEV && env.VITE_QA_SESSION
  && /^[a-zA-Z0-9_-]{8,64}$/.test(env.VITE_QA_SESSION)
  && new URLSearchParams(globalThis.location?.search ?? '').get('qa') === env.VITE_QA_SESSION
  ? env.VITE_QA_SESSION : null;
const getStorage = () => globalThis.localStorage ?? globalThis.window?.localStorage;
const ordinaryStorage = { scope: 'ordinary origin storage', get available(){try{return !!getStorage()}catch{return false}}, getItem:key=>getStorage().getItem(key), setItem:(key,value)=>getStorage().setItem(key,value), removeItem:key=>getStorage().removeItem(key) };
export const gameStorage = env?.DEV ? scopedStorage(getStorage, qaSession) : ordinaryStorage;
export function scopedUrl(value) {
  if (!qaSession) return value;
  const url = new URL(value, location.href); url.searchParams.set('qa', qaSession);
  return url.pathname + url.search + url.hash;
}
