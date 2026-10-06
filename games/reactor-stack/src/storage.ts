import { gameStorage } from '../../../shared/storage.mjs';
export interface Store { getItem(key: string): string | null; setItem(key: string, value: string): void; removeItem?(key: string): void }
export type ScoreEntry = { score: number; moves: number; result: 'WIN' | 'FAIL'; timestamp: number };
export const SCORE_KEY = 'reactor-stack-scores'; export const LEGACY_BEST_KEY = 'reactor-stack-best';
const storeOf = (store?: Store) => store ?? gameStorage;
const valid = (value: unknown): value is ScoreEntry => Boolean(value && typeof value === 'object' && Number.isFinite((value as ScoreEntry).score) && Number.isFinite((value as ScoreEntry).moves) && ((value as ScoreEntry).result === 'WIN' || (value as ScoreEntry).result === 'FAIL') && Number.isFinite((value as ScoreEntry).timestamp));
export function orderScores(entries: ScoreEntry[]): ScoreEntry[] { return entries.filter(valid).sort((a, b) => b.score - a.score || a.moves - b.moves || a.timestamp - b.timestamp).slice(0, 10); }
export function readScores(store?: Store): ScoreEntry[] { try { const parsed = JSON.parse(storeOf(store).getItem(SCORE_KEY) ?? '[]'); return Array.isArray(parsed) ? orderScores(parsed) : []; } catch { return []; } }
export function readBest(store?: Store): number { const scores = readScores(store); if (scores.length) return scores[0].score; try { const legacy = Number(storeOf(store).getItem(LEGACY_BEST_KEY)); return Number.isFinite(legacy) && legacy > 0 ? legacy : 0; } catch { return 0; } }
export function recordScore(entry: Omit<ScoreEntry, 'timestamp'>, store?: Store, timestamp = Date.now()): ScoreEntry[] { const next = orderScores([...readScores(store), { ...entry, timestamp }]); try { const target = storeOf(store); target.setItem(SCORE_KEY, JSON.stringify(next)); target.setItem(LEGACY_BEST_KEY, String(next[0]?.score ?? 0)); } catch { /* Players can continue without storage. */ } return next; }
export function saveBest(score: number, best: number, store?: Store): number { const next = Math.max(score, best); try { storeOf(store).setItem(LEGACY_BEST_KEY, String(next)); } catch { /* Session best still works. */ } return next; }
export function clearReactorStorage(store?: Store): void { try { const target = storeOf(store); target.removeItem?.(SCORE_KEY); target.removeItem?.(LEGACY_BEST_KEY); } catch { /* Storage is optional. */ } }
