export type AdType = 'startup' | 'interstitial' | 'rewarded' | 'banner';
export type FullscreenType = Exclude<AdType, 'banner'>;
export type AdResult = 'completed' | 'closed' | 'failed' | 'no_fill' | 'timeout' | 'unavailable' | 'blocked';
export type AdState = 'idle' | 'requested' | 'preparing' | 'ready' | 'courtesy' | 'showing' | 'completed' | 'closed' | 'failed';
export type GameState = 'unknown' | 'menu' | 'playing' | 'paused' | 'game-over';
export const BANNER_SLOTS = { primary: 'game-page-primary' } as const;
export interface Placement {
  id: string; gameId: string; adType: FullscreenType; enabled: boolean;
  cooldownSeconds: number; maxPerSession: number; safeEvents?: string[];
}
export interface AdRequest {
  requestId: string; gameId: string; placementId: string; adType: FullscreenType;
  userInitiated?: boolean; safeEvent?: string;
}
export interface AdResponse extends AdRequest { result: AdResult; rewardQualified: boolean; reason?: string }
export interface AdProvider {
  readonly name: string;
  initialize(): Promise<void>;
  isReady(type: AdType): boolean;
  prepareAd(request: AdRequest, signal: AbortSignal): Promise<'ready' | AdResult>;
  showAd(request: AdRequest, signal: AbortSignal, shown: () => void): Promise<AdResult>;
  showBanner(slot: string, host: HTMLElement): boolean;
  hideBanner(host: HTMLElement): void;
  destroy(): void;
}
export const DEFAULT_CONFIG = {
  master: true,
  startup: { enabled: true, oncePerSession: true, courtesy: true },
  interstitial: { enabled: true, firstSeconds: 180, intervalSeconds: 180, cooldownSeconds: 180, maxPerSession: 3, resetAfterRewarded: true },
  rewarded: { enabled: true, cooldownSeconds: 0, maxPerSession: 10, courtesy: true },
  banner: { enabled: false },
  courtesy: { enabled: true, durationMs: 1000, startup: true, interstitial: true, rewarded: true, mascot: true, animation: true, preset: 'friendly' },
  mock: { loadingMs: 300, durationMs: 5000, nextResult: 'completed' },
};
export type AdConfig = typeof DEFAULT_CONFIG;
const outcomes = ['completed', 'closed', 'failed', 'no_fill', 'timeout', 'unavailable'];
/** Only known config keys and bounded primitives survive local storage. */
export function normalizeConfig(input: unknown): AdConfig {
  const clean = structuredClone(DEFAULT_CONFIG);
  if (!input || typeof input !== 'object' || Array.isArray(input)) return clean;
  const source = input as Record<string, unknown>;
  if (typeof source.master === 'boolean') clean.master = source.master;
  for (const section of Object.keys(clean).filter((key) => key !== 'master')) {
    const target = (clean as unknown as Record<string, Record<string, unknown>>)[section];
    const candidate = source[section];
    if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) continue;
    for (const key of Object.keys(target)) {
      const value = (candidate as Record<string, unknown>)[key];
      if (typeof target[key] === 'boolean' && typeof value === 'boolean') target[key] = value;
      if (typeof target[key] === 'number' && typeof value === 'number' && Number.isFinite(value)) {
        const [min, max] = section === 'courtesy' ? [400, 2500]
          : section === 'mock' ? key === 'durationMs' ? [500, 15000] : [0, 5000]
          : key === 'maxPerSession' ? [0, 100] : [0, 86400];
        target[key] = Math.round(Math.max(min, Math.min(max, value)));
      }
    }
  }
  const raw = source as { mock?: { nextResult?: string }; courtesy?: { preset?: string } };
  if (outcomes.includes(raw.mock?.nextResult ?? '')) clean.mock.nextResult = raw.mock!.nextResult!;
  if (raw.courtesy?.preset === 'concise') clean.courtesy.preset = 'concise';
  return clean;
}
export type Counters = Record<'requests' | 'accepted' | 'blocked' | 'prepared' | 'shown' | 'completed' | 'closed' | 'failed' | 'no_fill' | 'timeout' | 'unavailable', number>;
export const emptyCounters = (): Counters => ({ requests: 0, accepted: 0, blocked: 0, prepared: 0, shown: 0, completed: 0, closed: 0, failed: 0, no_fill: 0, timeout: 0, unavailable: 0 });
export interface AdEvent {
  timestamp: string; event: string; gameId: string | null; placementId?: string; adType?: AdType;
  requestId?: string; result?: AdResult; reason?: string; activeSeconds: number; sessionSeconds: number;
}
