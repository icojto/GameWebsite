import { config as c } from './config.ts';
export type Phase = 'BOOT' | 'MENU' | 'PLAYING' | 'RESOLVING' | 'RESULT';
export type State = { board: number[]; heat: number; stability: number; score: number; turns: number; result: 'WIN' | 'FAIL' | null; reason: string };
export type RNG = () => number;
export const emptyState = (): State => ({ board: Array(c.gridWidth * c.gridHeight).fill(0), heat: 0, stability: 0, score: 0, turns: 0, result: null, reason: '' });
export function spawn(board: number[], rng: RNG, weights: readonly number[] = c.spawnTierWeights): number | null {
  const slots = board.flatMap((tier, i) => tier === 0 ? [i] : []);
  if (!slots.length) return null;
  const index = slots[Math.min(slots.length - 1, Math.floor(rng() * slots.length))];
  let value = rng() * weights.reduce((a, b) => a + b, 0);
  let tier = 1;
  for (let i = 0; i < weights.length - 1; i++) { value -= weights[i]; if (value < 0) break; tier++; }
  board[index] = tier;
  return index;
}
export function initialState(rng: RNG = Math.random): State {
  const state = emptyState();
  for (let i = 0; i < c.initialCellCount; i++) spawn(state.board, rng, c.initialTierWeights);
  return state;
}
export function legal(board: readonly number[], from: number, to: number): boolean {
  if (!Number.isInteger(from) || !Number.isInteger(to) || from < 0 || to < 0 || from >= board.length || to >= board.length || !board[from]) return false;
  const distance = Math.abs(from % c.gridWidth - to % c.gridWidth) + Math.abs(Math.floor(from / c.gridWidth) - Math.floor(to / c.gridWidth));
  return distance === 1 && (board[to] === 0 || (board[from] === board[to] && board[from] < c.tierDefinitions.length));
}
export function hasLegalAction(board: readonly number[]): boolean {
  return board.some((_, from) => board.some((__, to) => legal(board, from, to)));
}
export function evaluate(state: State): void {
  if (state.stability >= c.stabilityTarget) { state.result = 'WIN'; state.reason = 'Reactor stabilized'; }
  else if (state.heat >= c.heatMaximum) { state.result = 'FAIL'; state.reason = 'Critical heat exceeded'; }
  else if (!hasLegalAction(state.board)) { state.result = 'FAIL'; state.reason = 'Containment grid locked'; }
}
export function resolve(state: State, from: number, to: number, rng: RNG = Math.random) {
  if (state.result || !legal(state.board, from, to)) return null;
  const next: State = { ...state, board: [...state.board], turns: state.turns + 1 };
  const merged = next.board[to] !== 0;
  const tier = next.board[from] + (merged ? 1 : 0);
  next.board[from] = 0; next.board[to] = tier;
  next.heat = Math.max(0, Math.min(c.heatMaximum, next.heat + c.baseTurnHeat - (merged ? c.mergeHeatReductionByTier[tier] : 0)));
  if (merged) { next.stability = Math.min(c.stabilityTarget, next.stability + c.stabilityRewardByTier[tier]); next.score += c.scoreRewardByTier[tier]; }
  evaluate(next);
  const spawned = next.result ? null : spawn(next.board, rng);
  if (!next.result) evaluate(next); // A spawn can fill the last space and cause containment failure.
  return { next, merged, tier, spawned, from, to };
}
export class TurnController {
  phase: Phase = 'BOOT';
  state = emptyState();
  private rng: RNG;
  constructor(rng: RNG = Math.random) { this.rng = rng; }
  start() { this.state = initialState(this.rng); this.phase = 'PLAYING'; }
  act(from: number, to: number) {
    if (this.phase !== 'PLAYING') return null;
    const turn = resolve(this.state, from, to, this.rng);
    if (turn) { this.state = turn.next; this.phase = 'RESOLVING'; }
    return turn;
  }
  finish() { if (this.phase === 'RESOLVING') this.phase = this.state.result ? 'RESULT' : 'PLAYING'; }
}
