import type { AdConfig, AdProvider, AdRequest, AdResult, ProviderOutcome } from '../model.ts';
import type { GamePresentationBroker } from '../presentation.ts';

export class MockAdAdapter implements AdProvider {
  readonly name = 'MOCK';
  private prepared = new Map<string, AdResult>();
  private config: () => AdConfig;
  private consumed: () => void;
  private presentation: GamePresentationBroker;
  constructor(config: () => AdConfig, consumed: () => void, presentation: GamePresentationBroker) { this.config = config; this.consumed = consumed; this.presentation = presentation; }
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
  async showAd(request: AdRequest, signal: AbortSignal, shown: () => void): Promise<AdResult | ProviderOutcome> {
    const result = this.prepared.get(request.requestId);
    this.prepared.delete(request.requestId);
    if (!result) return 'unavailable';
    return this.presentation.present(request, this.config(), result, signal, shown);
  }
  showBanner(_slot: string, host: HTMLElement): boolean {
    host.classList.add('odesos-mock-banner'); host.textContent = 'MOCK AD — BANNER'; host.setAttribute('aria-label', 'Mock banner advertisement'); return true;
  }
  hideBanner(host: HTMLElement): void { host.hidden = true; host.replaceChildren(); }
  destroy(): void { this.presentation.cancel('provider-destroyed'); this.prepared.clear(); }
}

function delay(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) { reject(new Error('closed')); return; }
    const abort = () => { clearTimeout(timer); reject(new Error('closed')); };
    const timer = setTimeout(() => { signal.removeEventListener('abort', abort); resolve(); }, ms);
    signal.addEventListener('abort', abort, { once: true });
  });
}
