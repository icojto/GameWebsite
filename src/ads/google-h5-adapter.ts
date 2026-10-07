import type { AdProvider, AdResult } from './model.ts';

/** Pre-provider scaffold only. Not registered with the runtime and never loads a SDK.
 * Approved integration must run in the game canvas document, not this host bridge.
 * Public publisher ID, approvals, consent signals and explicit activation are later gates.
 */
export class GoogleH5Adapter implements AdProvider {
  readonly name = 'GOOGLE_H5_DISABLED';
  readonly startupFullscreenEnabled = false;
  readonly courtesyEnabled = false;
  async initialize(): Promise<void> {}
  isReady(): boolean { return false; }
  async prepareAd(): Promise<AdResult> { return 'unavailable'; }
  async showAd(): Promise<AdResult> { return 'unavailable'; }
  showBanner(): boolean { return false; }
  hideBanner(): void {}
  destroy(): void {}
}
