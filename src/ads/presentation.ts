import type { AdConfig, AdRequest, AdResult, ProviderOutcome } from './model.ts';

export type PresentationEvent = 'ad-presentation-ready' | 'ad-courtesy-started' | 'ad-presentation-shown' | 'ad-presentation-completed' | 'ad-presentation-closed' | 'ad-presentation-failed';
export type PresentationMessage = { type: PresentationEvent; requestId: string; gameId: string; placementId: string };
type Pending = { request: AdRequest; finish: (value: ProviderOutcome) => void; shown: () => void; timer: ReturnType<typeof setTimeout>; stage: 'requested' | 'ready' | 'courtesy' | 'shown'; arm: () => void };

/** Routes DEV mock visuals into the bound game iframe. It never renders website UI. */
export class GamePresentationBroker {
  private gameId: string | null = null;
  private send: ((message: Record<string, unknown>) => void) | null = null;
  private renderer = false;
  private pending: Pending | null = null;
  private observe: (event: string, request?: Partial<AdRequest>, result?: AdResult, reason?: string) => void = () => {};
  get rendererReady(): boolean { return Boolean(this.gameId && this.send && this.renderer); }
  get connectedGame(): string | null { return this.gameId; }
  setObserver(observer: typeof this.observe): void { this.observe = observer; }
  bind(gameId: string, send: (message: Record<string, unknown>) => void): void { this.cancel('renderer-rebound'); this.gameId = gameId; this.send = send; this.renderer = false; this.observe('renderer-connected', { gameId }); }
  unbind(gameId: string): void { if (this.gameId !== gameId) return; this.cancel('renderer-disconnected'); this.gameId = null; this.send = null; this.renderer = false; this.observe('renderer-disconnected', { gameId }); }
  ready(gameId: string, version: number | undefined): void { if (gameId !== this.gameId) return; this.renderer = version === 1; this.observe(this.renderer ? 'renderer-ready' : 'renderer-unavailable', { gameId }, undefined, this.renderer ? undefined : 'game-presentation-unavailable'); }
  async present(request: AdRequest, config: AdConfig, outcome: AdResult, signal: AbortSignal, shown: () => void): Promise<ProviderOutcome> {
    if (!this.rendererReady || request.gameId !== this.gameId || !this.send) {
      this.observe('renderer-unavailable', request, 'unavailable', 'game-presentation-unavailable');
      return { result: 'unavailable', reason: 'game-presentation-unavailable' };
    }
    if (this.pending) return { result: 'blocked', reason: 'another-ad-active' };
    return new Promise((resolve) => {
      const finish = (value: ProviderOutcome) => {
        if (!this.pending || this.pending.request.requestId !== request.requestId) return;
        clearTimeout(this.pending.timer); signal.removeEventListener('abort', abort); this.pending = null; resolve(value);
      };
      const abort = () => { this.send?.({ type: 'ad-presentation-cancel', requestId: request.requestId, gameId: request.gameId, placementId: request.placementId, reason: String(signal.reason ?? 'cancelled') }); finish({ result: 'closed', reason: String(signal.reason ?? 'cancelled') }); };
      const typeCourtesy = request.adType === 'interstitial' || config[request.adType].courtesy;
      const courtesyEnabled = config.courtesy.enabled && config.courtesy[request.adType] && typeCourtesy;
      const budget = config.mock.presentationTimeoutMs + config.mock.durationMs + (courtesyEnabled ? config.courtesy.durationMs : 0);
      const expire = () => {
        this.send?.({ type: 'ad-presentation-cancel', requestId: request.requestId, gameId: request.gameId, placementId: request.placementId, reason: 'game-presentation-timeout' });
        this.observe('presentation-timeout', request, 'timeout', 'game-presentation-timeout');
        finish({ result: 'timeout', reason: 'game-presentation-timeout' });
      };
      const timer = setTimeout(expire, config.mock.presentationTimeoutMs);
      const arm = () => { if (this.pending) { clearTimeout(this.pending.timer); this.pending.timer = setTimeout(expire, budget); } };
      this.pending = { request, finish, shown, timer, stage: 'requested', arm };
      signal.addEventListener('abort', abort, { once: true });
      this.observe('presentation-requested', request);
      this.send!({
        type: 'ad-presentation-request', requestId: request.requestId, gameId: request.gameId, placementId: request.placementId, adType: request.adType,
        courtesy: { enabled: courtesyEnabled, preset: config.courtesy.preset, durationMs: config.courtesy.durationMs, mascot: config.courtesy.mascot, animation: config.courtesy.animation },
        mock: { durationMs: config.mock.durationMs, outcome },
        timeoutMs: Math.min(30000, budget),
      });
    });
  }
  receive(message: PresentationMessage): boolean {
    const pending = this.pending;
    if (!pending || message.gameId !== pending.request.gameId || message.requestId !== pending.request.requestId || message.placementId !== pending.request.placementId) return false;
    const request = pending.request;
    if (message.type === 'ad-presentation-ready' && pending.stage === 'requested') { pending.stage = 'ready'; pending.arm(); this.observe('presentation-ready', request); return true; }
    if (message.type === 'ad-courtesy-started' && pending.stage === 'ready') { pending.stage = 'courtesy'; this.observe('courtesy-started', request); return true; }
    if (message.type === 'ad-presentation-shown' && (pending.stage === 'ready' || pending.stage === 'courtesy')) { pending.stage = 'shown'; pending.shown(); this.observe('ad-visual-started', request); return true; }
    if (message.type === 'ad-presentation-completed' && pending.stage === 'shown') { this.observe('presentation-completed', request, 'completed'); pending.finish({ result: 'completed' }); return true; }
    if (message.type === 'ad-presentation-closed') { this.observe('presentation-closed', request, 'closed'); pending.finish({ result: 'closed' }); return true; }
    if (message.type === 'ad-presentation-failed') { this.observe('presentation-failed', request, 'failed', 'game-presentation-failed'); pending.finish({ result: 'failed', reason: 'game-presentation-failed' }); return true; }
    return false;
  }
  cancel(reason: string): void { if (!this.pending) return; const pending = this.pending; this.send?.({ type: 'ad-presentation-cancel', requestId: pending.request.requestId, gameId: pending.request.gameId, placementId: pending.request.placementId, reason }); pending.finish({ result: 'closed', reason }); }
}
