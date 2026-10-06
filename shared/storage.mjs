import { scopedStorage } from './storage-scope.mjs';
import { seededRandom } from './seeded-random.mjs';
// Vite folds the development branch away. Namespace selection precedes all reads.
const development = typeof import.meta.env !== 'undefined' && import.meta.env.DEV;
export const qaSession = development && import.meta.env.VITE_QA_SESSION
  && /^[a-zA-Z0-9_-]{8,64}$/.test(import.meta.env.VITE_QA_SESSION)
  && new URLSearchParams(globalThis.location?.search ?? '').get('qa') === import.meta.env.VITE_QA_SESSION
  ? import.meta.env.VITE_QA_SESSION : null;
const getStorage = () => globalThis.localStorage ?? globalThis.window?.localStorage;
const ordinaryStorage = { scope: 'ordinary origin storage', get available(){try{return !!getStorage()}catch{return false}}, getItem:key=>getStorage().getItem(key), setItem:(key,value)=>getStorage().setItem(key,value), removeItem:key=>getStorage().removeItem(key) };
export const gameStorage = development ? scopedStorage(getStorage, qaSession) : ordinaryStorage;
export const gameRandom = development && qaSession ? seededRandom(41) : Math.random;
export function scopedUrl(value) {
  if (!qaSession) return value;
  const url = new URL(value, location.href); url.searchParams.set('qa', qaSession);
  return url.pathname + url.search + url.hash;
}
