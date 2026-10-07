import type { RunPhase } from './run.ts';
/** Background actions belong only to the initial menu or active gameplay. */
export function allowsBackgroundAction(phase: RunPhase, blocked: boolean): boolean {
  return !blocked && (phase === 'menu' || phase === 'playing');
}
