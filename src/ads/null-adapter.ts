import type { AdProvider, AdResult } from './model.ts';

/** Production's sole provider until a real adapter is intentionally reviewed. */
export class NullAdAdapter implements AdProvider {
  readonly name = 'NULL';
  async initialize(): Promise<void> {}
  isReady(): boolean { return false; }
  async prepareAd(): Promise<AdResult> { return 'unavailable'; }
  async showAd(): Promise<AdResult> { return 'unavailable'; }
  showBanner(): boolean { return false; }
  hideBanner(): void {}
  destroy(): void {}
}
