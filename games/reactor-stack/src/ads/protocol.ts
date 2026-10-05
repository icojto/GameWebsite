export const PROTOCOL = 'odesos-ads';
// The established website ad bridge identifies games by catalog slug.
export const GAME_ID = 'reactor-stack';
export type AdType = 'startup' | 'interstitial' | 'rewarded';
export type Result = 'completed' | 'closed' | 'failed' | 'no_fill' | 'timeout' | 'unavailable' | 'blocked';
export type GamePhase = 'unknown' | 'menu' | 'playing' | 'paused' | 'game-over';
export interface Capabilities { providerMode: 'mock' | 'null' | 'real'; fullscreenAvailable: boolean; rewardedAvailable: boolean; startupDue: boolean }
export const NO_ADS: Capabilities = { providerMode: 'null', fullscreenAvailable: false, rewardedAvailable: false, startupDue: false };
export interface Identity { requestId: string; gameId: string; placementId: string; adType: AdType }
export interface Presentation extends Identity {
  type: 'ad-presentation-request';
  courtesy: { enabled: boolean; preset: 'friendly' | 'concise'; durationMs: number; mascot: boolean; animation: boolean };
  mock: { durationMs: number; outcome: Result };
  timeoutMs?: number;
}
export interface AdResponse extends Identity { result: Result; rewardQualified: boolean; reason?: string; runId?: string; shown: boolean }
export type Lifecycle = 'ad-presentation-ready' | 'ad-courtesy-started' | 'ad-presentation-shown' | 'ad-presentation-completed' | 'ad-presentation-closed' | 'ad-presentation-failed';
type Envelope = { protocol: typeof PROTOCOL; version: 1; gameId: string; requestId: string };
export type HostMessage = Envelope & (
  { type: 'bridge-hello' } |
  ({ type: 'bridge-ready'; presentationVersion: 1 } & Capabilities) |
  ({ type: 'ad-capabilities' } & Capabilities) |
  ({ type: 'ad-accepted' | 'ad-blocked' | 'ad-will-show' | 'ad-shown'; preview?: boolean; reason?: string } & Identity) |
  ({ type: 'ad-result'; preview?: boolean; userInitiated?: boolean; safeEvent?: string } & Omit<AdResponse, 'shown'>) |
  { type: 'ad-presentation-cancel'; placementId: string; reason?: string } | Presentation
);
export interface Clock { now(): number; set(fn: () => void, ms: number): ReturnType<typeof setTimeout>; clear(id: ReturnType<typeof setTimeout>): void }
export const clock: Clock = { now: () => performance.now(), set: (fn, ms) => setTimeout(fn, ms), clear: (id) => clearTimeout(id) };
const record = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
export const validId = (v: unknown): v is string => typeof v === 'string' && /^[a-z0-9][a-z0-9._:-]{0,79}$/i.test(v);
const bounded = (v: unknown, min: number, max: number) => typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max;
const keys = (v: Record<string, unknown>, allowed: string[]) => Object.keys(v).every((key) => allowed.includes(key));
const results = ['completed', 'closed', 'failed', 'no_fill', 'timeout', 'unavailable', 'blocked'];
const types = ['startup', 'interstitial', 'rewarded'];
export function placementType(id: string, previews = false): AdType | null {
  if (id === 'reactor.startup') return 'startup';
  if (id === 'reactor.start-interstitial' || id === 'reactor.pause-interstitial') return 'interstitial';
  if ((id === 'reactor.cool-refill' || id === 'reactor.upgrade-refill')) return 'rewarded';
  if (previews) for (const type of types) if (id === `dev-${GAME_ID}-${type}`) return type as AdType;
  return null;
}
/** Exact schema and primitive checks; transport origin/source are checked by the client. */
export function parseHostMessage(value: unknown): HostMessage | null {
  if (!record(value) || value.protocol !== PROTOCOL || value.version !== 1 || value.gameId !== GAME_ID || !validId(value.requestId)) return null;
  const common = ['protocol', 'version', 'type', 'gameId', 'requestId'];
  let extra: string[] = [];
  if (value.type === 'bridge-hello') extra = [];
  else if (value.type === 'bridge-ready' || value.type === 'ad-capabilities') {
    if (!['mock', 'null', 'real'].includes(String(value.providerMode)) || typeof value.providerMode !== 'string'
      || !['fullscreenAvailable', 'rewardedAvailable', 'startupDue'].every((key) => typeof value[key] === 'boolean')) return null;
    if (value.type === 'bridge-ready' && value.presentationVersion !== 1) return null;
    extra = ['providerMode', 'fullscreenAvailable', 'rewardedAvailable', 'startupDue', ...(value.type === 'bridge-ready' ? ['presentationVersion'] : [])];
  } else {
    if (!validId(value.placementId)) return null;
    if (value.reason !== undefined && (typeof value.reason !== 'string' || value.reason.length > 200)) return null;
    if (value.type === 'ad-presentation-cancel') extra = ['placementId', 'reason'];
    else {
      if (typeof value.adType !== 'string' || !types.includes(value.adType) || placementType(value.placementId, true) !== value.adType) return null;
      extra = ['placementId', 'adType'];
      if (value.type === 'ad-presentation-request') {
        const c = value.courtesy, m = value.mock;
        if (!record(c) || !record(m) || !keys(c, ['enabled', 'preset', 'durationMs', 'mascot', 'animation']) || !keys(m, ['durationMs', 'outcome'])
          || !['enabled', 'mascot', 'animation'].every((key) => typeof c[key] === 'boolean')
          || (c.preset !== 'friendly' && c.preset !== 'concise') || !bounded(c.durationMs, 0, 2500)
          || !bounded(m.durationMs, 0, 15000) || typeof m.outcome !== 'string' || !results.includes(m.outcome)
          || (value.timeoutMs !== undefined && !bounded(value.timeoutMs, 1, 45000))) return null;
        extra.push('courtesy', 'mock', 'timeoutMs');
      } else {
        if (value.preview !== undefined && typeof value.preview !== 'boolean') return null;
        extra.push('preview', 'reason');
        if (value.type === 'ad-result') {
          if (typeof value.result !== 'string' || !results.includes(value.result) || typeof value.rewardQualified !== 'boolean'
            || (value.runId !== undefined && !validId(value.runId)) || (value.safeEvent !== undefined && !validId(value.safeEvent))
            || (value.userInitiated !== undefined && typeof value.userInitiated !== 'boolean')) return null;
          extra.push('result', 'rewardQualified', 'runId', 'safeEvent', 'userInitiated');
        } else if (!['ad-accepted', 'ad-blocked', 'ad-will-show', 'ad-shown'].includes(String(value.type))) return null;
      }
    }
  }
  return keys(value, [...common, ...extra]) ? value as HostMessage : null;
}
