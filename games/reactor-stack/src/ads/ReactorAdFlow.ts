import type { TurnController } from '../rules.ts';
import type { AdResponse, AdType, Capabilities } from './protocol.ts';

export type Power = 'cool' | 'upgrade';
export interface AdPort {
  capabilities: Capabilities;
  request(type: AdType, placement: string, values?: { safeEvent?: string; userInitiated?: boolean; runId?: string }): Promise<AdResponse>;
  acknowledge(result: AdResponse): void;
}
interface Hooks { start(): void; changed(): void; cancelGesture(): void; feedback(text: string): void }
export const inventoryKey = (power: Power) => power === 'cool' ? 'coolCoreRemaining' : 'upgradeRemaining';
const placement = (power: Power) => `reactor.${power}-refill`;
/** Reactor transitions only. Host remains authoritative for all ad policy and clocks. */
export class ReactorAdFlow {
  runId = '';
  pending: 'start' | 'pause' | Power | null = null;
  pauseQueued = false;
  suspended = false;
  attempts = { cool: false, upgrade: false };
  lastPlacement = 'none';
  lastResult = 'none';
  private epoch = 0;
  private alive = true;
  private applied = new Set<string>();
  constructor(readonly controller: TurnController, readonly ads: AdPort, private hooks: Hooks) {}
  get locked(): boolean { return !this.alive || this.pending !== null || this.pauseQueued || this.suspended; }
  canRefill(power: Power): boolean {
    return !this.locked && !!this.runId && this.controller.phase === 'PLAYING' && !this.controller.state.result
      && this.controller.state[inventoryKey(power)] === 0 && !this.attempts[power] && this.ads.capabilities.rewardedAvailable;
  }
  freshRun(): void {
    if (!this.alive || this.pending || this.suspended) return;
    this.epoch++; this.pauseQueued = false; this.runId = crypto.randomUUID();
    this.attempts = { cool: false, upgrade: false }; this.applied.clear();
    this.hooks.start(); this.hooks.changed();
  }
  private async request(type: AdType, id: string, values = {}): Promise<AdResponse> {
    this.lastPlacement = id;
    const result = await this.ads.request(type, id, values);
    this.lastResult = `${result.result}: ${result.reason ?? 'none'}`;
    return result;
  }
  async start(): Promise<void> {
    if (this.locked || !['MENU', 'RESULT', 'PAUSED'].includes(this.controller.phase)) return;
    this.pending = 'start'; this.hooks.cancelGesture(); const token = ++this.epoch; this.hooks.changed();
    try {
      if (this.ads.capabilities.fullscreenAvailable) {
        let interstitial = true;
        if (this.ads.capabilities.startupDue) {
          const result = await this.request('startup', 'reactor.startup');
          interstitial = result.result === 'blocked' && ['disabled', 'startup-once-per-session', 'placement-cap'].includes(result.reason ?? '');
        }
        if (this.alive && token === this.epoch && interstitial)
          await this.request('interstitial', 'reactor.start-interstitial', { safeEvent: 'start-requested' });
      }
    } catch { this.lastResult = 'failed: transport'; }
    finally {
      if (this.alive && token === this.epoch) { this.pending = null; this.freshRun(); }
    }
  }
  pause(): void {
    if (this.locked || !['PLAYING', 'RESOLVING'].includes(this.controller.phase)) return;
    this.pauseQueued = true; this.hooks.cancelGesture(); this.hooks.changed();
    if (this.controller.phase === 'PLAYING') void this.settledTurn();
  }
  async settledTurn(): Promise<void> {
    if (!this.pauseQueued || this.controller.phase === 'RESOLVING') return;
    this.pauseQueued = false;
    if (this.controller.phase !== 'PLAYING' || this.controller.state.result) { this.hooks.changed(); return; }
    this.controller.pause(); this.pending = 'pause'; const token = this.epoch; this.hooks.changed();
    try {
      if (this.ads.capabilities.fullscreenAvailable)
        await this.request('interstitial', 'reactor.pause-interstitial', { safeEvent: 'pause-requested' });
    } catch { this.lastResult = 'failed: transport'; }
    finally { if (this.alive && token === this.epoch) { this.pending = null; this.hooks.changed(); } }
  }
  resume(): void { if (!this.locked) { this.controller.resume(); this.hooks.changed(); } }
  menu(): boolean {
    if (this.locked || this.controller.phase === 'RESOLVING') return false;
    this.epoch++; this.runId = ''; this.controller.setMenu(); this.hooks.cancelGesture(); this.hooks.changed(); return true;
  }
  async refill(power: Power): Promise<void> {
    if (!this.canRefill(power)) return;
    this.pending = power; this.hooks.cancelGesture(); const token = this.epoch, runId = this.runId;
    this.hooks.changed();
    try {
      const result = await this.request('rewarded', placement(power), { userInitiated: true, runId });
      if (!this.alive || token !== this.epoch || runId !== this.runId || this.controller.phase !== 'PLAYING'
        || result.gameId !== 'reactor-stack' || result.adType !== 'rewarded' || result.placementId !== placement(power) || result.runId !== runId) return;
      this.attempts[power] ||= result.shown || result.reason === 'placement-run-cap';
      if (result.shown && result.result === 'completed' && result.rewardQualified && !this.applied.has(result.requestId)
        && this.controller.state[inventoryKey(power)] === 0 && !this.controller.state.result) {
        this.applied.add(result.requestId); this.controller.state[inventoryKey(power)]++;
        this.controller.state[power === 'cool' ? 'coolGranted' : 'upgradeGranted']++;
        this.ads.acknowledge(result); this.hooks.feedback(power === 'cool' ? '+1 Cool Core' : '+1 Upgrade');
      } else this.hooks.feedback('No reward received');
    } catch { this.lastResult = 'failed: transport'; this.hooks.feedback('No reward received'); }
    finally { if (this.alive && token === this.epoch) { this.pending = null; this.hooks.changed(); } }
  }
  destroy(): void { this.alive = false; this.epoch++; this.pending = null; this.pauseQueued = false; }
}
