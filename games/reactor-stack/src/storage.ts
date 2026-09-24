export interface Store { getItem(key: string): string | null; setItem(key: string, value: string): void }
export function readBest(store?: Store): number { try { const n = Number((store ?? localStorage).getItem('reactor-stack-best')); return Number.isFinite(n) && n > 0 ? n : 0; } catch { return 0; } }
export function saveBest(score: number, best: number, store?: Store): number { const next = Math.max(score, best); try { (store ?? localStorage).setItem('reactor-stack-best', String(next)); } catch { /* Session best still works. */ } return next; }
