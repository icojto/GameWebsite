import type { AdConfig, AdProvider, AdRequest, AdResult } from '../model.ts';
import { delay, DevAdOverlay } from './overlay.ts';

export class MockAdAdapter implements AdProvider {
  readonly name = 'MOCK';
  private prepared = new Map<string, AdResult>();
  private config: () => AdConfig;
  private consumed: () => void;
  private overlay: DevAdOverlay;
  constructor(config: () => AdConfig, consumed: () => void, overlay: DevAdOverlay) { this.config = config; this.consumed = consumed; this.overlay = overlay; }
  async initialize(): Promise<void> {}
  isReady(): boolean { return true; }
  async prepareAd(request: AdRequest, signal: AbortSignal): Promise<'ready' | AdResult> {
    const selected = this.config().mock.nextResult as AdResult;
    this.consumed(); // One shot: subsequent requests return to completed.
    await delay(this.config().mock.loadingMs, signal);
    if (selected !== 'completed' && selected !== 'closed') return selected;
    this.prepared.set(request.requestId, selected);
    signal.addEventListener('abort', () => this.prepared.delete(request.requestId), { once: true });
    return 'ready';
  }
  async showAd(request: AdRequest, signal: AbortSignal, shown: () => void): Promise<AdResult> {
    const result = this.prepared.get(request.requestId);
    this.prepared.delete(request.requestId);
    if (!result) return 'unavailable';
    return this.overlay.show(request, this.config().mock.durationMs, result, signal, shown);
  }
  showBanner(_slot: string, host: HTMLElement): boolean {
    host.classList.add('odesos-mock-banner'); host.textContent = 'MOCK AD — BANNER'; host.setAttribute('aria-label', 'Mock banner advertisement'); return true;
  }
  hideBanner(host: HTMLElement): void { host.hidden = true; host.replaceChildren(); }
  destroy(): void { this.overlay.destroy(); this.prepared.clear(); }
}
