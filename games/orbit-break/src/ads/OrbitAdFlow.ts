import type { RunState } from '../game/run.ts';
import type { AdResponse, AdType, Capabilities } from './protocol.ts';

export interface AdPort {
  capabilities: Capabilities;
  request(type: AdType, placement: string, values?: { safeEvent?: string; userInitiated?: boolean; runId?: string }): Promise<AdResponse>;
  acknowledge(result: AdResponse): void;
}
interface Hooks { started(): void; revived(): void; finalized(): void; changed(): void }
/** Game-owned decisions. Provider eligibility and clocks remain entirely in the host. */
export class OrbitAdFlow {
  runId = '';
  consumed = false;
  finalized = true;
  pending = false;
  offerMs = 0;
  settings = { offerSeconds: 8, protectionSeconds: 1.5, attackDelaySeconds: 1 };
  private alive = true;
  constructor(readonly run: RunState, private ads: AdPort, private hooks: Hooks) {}
  get offer(): boolean { return this.run.phase === 'game-over' && !this.finalized && !this.consumed && this.offerMs > 0; }

  async requestStartRun(): Promise<void> {
    if (!this.alive || this.pending || !['menu', 'game-over'].includes(this.run.phase)) return;
    const restart = this.run.phase === 'game-over';
    this.pending = true;
    if (restart) this.finalize();
    this.hooks.changed();
    try {
      if (this.ads.capabilities.fullscreenAvailable) {
        let interstitial = true;
        if (!restart && this.ads.capabilities.startupDue) {
          const result = await this.ads.request('startup', 'orbit.startup');
          // Only a host eligibility rejection can fall through. Once selected, an
          // unavailable, closed, failed or timed-out startup ends this opportunity.
          interstitial = result.result === 'blocked' && ['disabled', 'startup-once-per-session', 'placement-cap'].includes(result.reason ?? '');
        }
        if (interstitial) await this.ads.request('interstitial', restart ? 'orbit.restart-interstitial' : 'orbit.play-interstitial',
          { safeEvent: restart ? 'restart-requested' : 'play-requested' });
      }
    } finally {
      if (this.alive) {
        this.runId = crypto.randomUUID(); this.consumed = false; this.finalized = false; this.offerMs = 0;
        this.run.start(); this.hooks.started();
      }
      this.pending = false; this.hooks.changed();
    }
  }
  death(): void {
    if (!this.alive || this.finalized) return;
    this.run.phase = 'game-over';
    this.offerMs = !this.consumed && this.ads.capabilities.rewardedAvailable ? this.settings.offerSeconds * 1000 : 0;
    if (!this.offerMs) this.finalize();
    this.hooks.changed();
  }
  tick(deltaMs: number): void {
    if (!this.offer || this.pending) return;
    this.offerMs = Math.max(0, this.offerMs - Math.max(0, deltaMs));
    if (!this.offerMs) this.finalize();
    this.hooks.changed();
  }
  async revive(): Promise<void> {
    if (!this.alive || !this.offer || this.pending || !this.ads.capabilities.rewardedAvailable) return;
    this.pending = true; this.hooks.changed();
    const runId = this.runId;
    try {
      const result = await this.ads.request('rewarded', 'orbit.revive', { userInitiated: true, runId });
      if (!this.alive || this.runId !== runId || this.finalized) return;
      this.consumed ||= result.shown || result.reason === 'placement-run-cap';
      if (result.runId === runId && result.shown && result.result === 'completed' && result.rewardQualified) {
        this.consumed = true; this.offerMs = 0;
        this.run.revive(this.settings.protectionSeconds * 1000, this.settings.attackDelaySeconds * 1000);
        this.ads.acknowledge(result); this.hooks.revived();
      } else if (this.consumed) this.finalize();
      else this.offerMs = Math.max(this.offerMs, 3000);
    } finally { this.pending = false; this.hooks.changed(); }
  }
  finalize(): void {
    if (this.finalized) return;
    this.finalized = true; this.offerMs = 0; this.hooks.finalized();
  }
  menu(): boolean {
    if (this.pending) return false;
    this.finalize(); this.run.menu(); this.hooks.changed(); return true;
  }
  destroy(): void { this.alive = false; }
}
