import { clock, type Clock, type Lifecycle, type Presentation } from './protocol.ts';

export interface AdView {
  courtesy(payload: Presentation): void;
  showing(payload: Presentation, close: () => void): void;
  countdown(seconds: number): void;
  clear(): void;
  destroy(): void;
}
/** Presentation only: no provider, eligibility, game state or reward knowledge. */
export class GameAdPlayer {
  private active: { payload: Presentation; emit: (event: Lifecycle, reason?: 'player-skip' | 'external-close') => void; endAt: number; stage: 'courtesy' | 'showing' } | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  constructor(private readonly view: AdView, private readonly time: Clock = clock) {}
  play(payload: Presentation, emit: (event: Lifecycle, reason?: 'player-skip' | 'external-close') => void): boolean {
    if (this.active) return false;
    this.active = { payload, emit, stage: 'courtesy', endAt: 0 };
    emit('ad-presentation-ready');
    try {
      if (payload.courtesy.enabled) {
        this.view.courtesy(payload); emit('ad-courtesy-started');
        this.timer = this.time.set(() => this.show(), payload.courtesy.durationMs);
      } else this.show();
    } catch { this.finish('ad-presentation-failed'); }
    return true;
  }
  private show(): void {
    const current = this.active;
    if (!current) return;
    current.stage = 'showing'; current.endAt = this.time.now() + current.payload.mock.durationMs;
    try {
      this.view.showing(current.payload, () => { if (this.active === current && current.payload.adType === 'rewarded') this.finish('ad-presentation-closed', 'player-skip'); });
      current.emit('ad-presentation-shown'); this.tick();
    } catch { this.finish('ad-presentation-failed'); }
  }
  private tick(): void {
    const current = this.active;
    if (!current) return;
    const remaining = Math.max(0, current.endAt - this.time.now());
    this.view.countdown(remaining / 1000);
    if (!remaining) {
      const outcome = current.payload.mock.outcome;
      this.finish(outcome === 'completed' ? 'ad-presentation-completed' : outcome === 'closed' ? 'ad-presentation-closed' : 'ad-presentation-failed', outcome === 'closed' ? 'external-close' : undefined);
    } else this.timer = this.time.set(() => this.tick(), Math.min(100, remaining));
  }
  private finish(event: Lifecycle, reason?: 'player-skip' | 'external-close'): void {
    const current = this.active;
    if (!current) return;
    this.cancel(); current.emit(event, reason);
  }
  cancel(): void {
    if (this.timer !== null) this.time.clear(this.timer);
    this.timer = null; this.active = null; this.view.clear();
  }
  destroy(): void { this.cancel(); this.view.destroy(); }
}
