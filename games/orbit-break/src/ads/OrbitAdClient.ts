import { clock, GAME_ID, NO_ADS, parseHostMessage, placementType, PROTOCOL, type AdResponse, type AdType, type Capabilities, type Clock, type GamePhase, type Identity, type Lifecycle, type Presentation } from './protocol.ts';

interface Pending extends Identity {
  runId?: string; preview: boolean; shown: boolean; stage: 'requested' | 'accepted' | 'will-show' | 'presenting' | 'terminal';
  timer: ReturnType<typeof setTimeout>; resolve: (result: AdResponse) => void;
}
interface Options {
  origin: string; source: unknown; send(message: Record<string, unknown>): void;
  suspend(value: boolean): void; changed(): void;
  present(payload: Presentation, emit: (event: Lifecycle) => void): boolean;
  cancelPresentation(): void;
  presentationReady?(): boolean;
  time?: Clock; requestTimeoutMs?: number;
}
export class OrbitAdClient {
  capabilities: Capabilities = { ...NO_ADS };
  connected = false;
  suspended = false;
  lastResult = 'none';
  private pending: Pending | null = null;
  private readyId = '';
  private phase: GamePhase = 'menu';
  private reported: GamePhase | null = null;
  private alive = true;
  private time: Clock;
  private receipts = new Set<string>();
  private settled = new Set<string>();
  constructor(private readonly options: Options) { this.time = options.time ?? clock; }
  get busy(): boolean { return this.pending !== null; }
  start(): void {
    if (!this.alive) return;
    this.readyId = crypto.randomUUID();
    this.send('game-ready', { requestId: this.readyId, ...(this.options.presentationReady?.() === false ? {} : { presentationVersion: 1 }) });
  }
  reportState(phase: GamePhase): void {
    this.phase = phase;
    if (!this.connected || this.reported === phase) return;
    this.reported = phase; this.send('game-state', { state: phase });
  }
  request(adType: AdType, placementId: string, values: { safeEvent?: string; userInitiated?: boolean; runId?: string } = {}): Promise<AdResponse> {
    const identity = { requestId: crypto.randomUUID(), gameId: GAME_ID, placementId, adType, runId: values.runId };
    if (!this.connected || this.busy || placementType(placementId) !== adType) return Promise.resolve({ ...identity, result: 'unavailable', rewardQualified: false, shown: false, reason: 'bridge-unavailable' });
    return new Promise((resolve) => {
      this.pending = { ...identity, preview: false, shown: false, stage: 'requested', resolve, timer: this.time.set(() => this.timeout(), this.options.requestTimeoutMs ?? 35000) };
      if (adType === 'interstitial') this.send('game-event', { requestId: identity.requestId, placementId, event: values.safeEvent });
      else this.send('ad-request', { requestId: identity.requestId, placementId, adType, ...values });
      this.options.changed();
    });
  }
  receive(event: { origin: string; source: unknown; data: unknown }): void {
    if (!this.alive || event.origin !== this.options.origin || event.source !== this.options.source) return;
    const message = parseHostMessage(event.data);
    if (!message) return;
    if (message.type === 'bridge-hello') { this.start(); return; }
    if (message.type === 'bridge-ready' || message.type === 'ad-capabilities') {
      if (message.type === 'bridge-ready' ? message.requestId !== this.readyId : !this.connected) return;
      this.connected = true;
      this.capabilities = { providerMode: message.providerMode, fullscreenAvailable: message.fullscreenAvailable, rewardedAvailable: message.rewardedAvailable, startupDue: message.startupDue };
      if (message.type === 'bridge-ready') this.reported = null;
      this.reportState(this.phase); this.options.changed(); return;
    }
    if (!this.connected || this.settled.has(message.requestId)) return;
    // Website DEV previews are explicitly announced; they can never deliver a game reward.
    if (!this.pending && message.type === 'ad-will-show' && message.preview === true
      && this.capabilities.providerMode === 'mock' && message.placementId === `dev-${GAME_ID}-${message.adType}`) {
      this.pending = { ...message, preview: true, shown: false, stage: 'accepted', resolve: () => {},
        timer: this.time.set(() => this.timeout(), this.options.requestTimeoutMs ?? 35000) };
    }
    const current = this.pending;
    if (!current || message.requestId !== current.requestId || message.placementId !== current.placementId
      || ('adType' in message && message.adType !== current.adType)) return;
    if (message.type === 'ad-accepted' && current.stage === 'requested') current.stage = 'accepted';
    else if (message.type === 'ad-will-show' && current.stage === 'accepted') {
      current.stage = 'will-show'; this.setSuspended(true);
    } else if (message.type === 'ad-presentation-request' && current.stage === 'will-show' && this.capabilities.providerMode === 'mock') {
      current.stage = 'presenting';
      this.time.clear(current.timer);
      current.timer = this.time.set(() => this.timeout(), (message.timeoutMs ?? message.mock.durationMs + message.courtesy.durationMs + 5000) + 2000);
      if (!this.options.present(message, (type) => {
        if (this.pending !== current || current.stage === 'terminal') return;
        if (type === 'ad-presentation-shown') current.shown = true;
        if (['ad-presentation-completed', 'ad-presentation-closed', 'ad-presentation-failed'].includes(type)) current.stage = 'terminal';
        this.send(type, { requestId: current.requestId, placementId: current.placementId });
      })) { this.send('ad-presentation-failed', { requestId: current.requestId, placementId: current.placementId }); }
    } else if (message.type === 'ad-shown' && ['will-show', 'presenting', 'terminal'].includes(current.stage)) current.shown = true;
    else if (message.type === 'ad-presentation-cancel') {
      this.settle({ ...current, result: message.reason?.includes('timeout') ? 'timeout' : 'closed', rewardQualified: false, reason: message.reason });
    } else if (message.type === 'ad-result') {
      if (current.runId !== message.runId) return;
      const qualified = !current.preview && current.shown && message.result === 'completed' && message.rewardQualified;
      this.settle({ ...message, shown: current.shown, rewardQualified: qualified });
    }
  }
  acknowledge(result: AdResponse): void {
    if (!result.rewardQualified || this.receipts.has(result.requestId)) return;
    this.receipts.add(result.requestId);
    this.send('reward-granted', { adRequestId: result.requestId, placementId: result.placementId });
  }
  private timeout(): void {
    const current = this.pending;
    if (current) {
      this.send('ad-presentation-failed', { requestId: current.requestId, placementId: current.placementId });
      this.settle({ ...current, result: 'timeout', rewardQualified: false, reason: 'game-client-timeout' });
    }
  }
  private settle(result: AdResponse): void {
    const current = this.pending;
    if (!current) return;
    this.time.clear(current.timer); this.pending = null;
    this.settled.add(current.requestId);
    if (this.settled.size > 2000) this.settled.delete(this.settled.values().next().value!);
    this.options.cancelPresentation(); this.lastResult = `${result.result}${result.reason ? ': ' + result.reason : ''}`;
    this.setSuspended(false); current.resolve(result); this.options.changed();
  }
  private setSuspended(value: boolean): void {
    if (this.suspended === value) return;
    this.suspended = value; this.options.suspend(value);
  }
  private send(type: string, values: Record<string, unknown>): void {
    if (this.alive) this.options.send({ protocol: PROTOCOL, version: 1, gameId: GAME_ID, requestId: crypto.randomUUID(), type, ...values });
  }
  destroy(): void {
    if (this.pending) this.settle({ ...this.pending, result: 'closed', rewardQualified: false, reason: 'game-destroyed' });
    this.alive = false; this.connected = false; this.capabilities = { ...NO_ADS };
  }
}
