import type { AdService } from './service.ts';
import type { AdRequest, GameState } from './model.ts';
import type { GamePresentationBroker, PresentationEvent, PresentationMessage } from './presentation.ts';

export const AD_PROTOCOL = 'odesos-ads';
export const AD_VERSION = 1;
type Base = { protocol: typeof AD_PROTOCOL; version: 1; requestId: string; gameId: string };
export type GameAdMessage = Base & (
  { type: 'game-ready'; presentationVersion?: 1 } |
  { type: 'game-state'; state: Exclude<GameState, 'unknown'> } |
  { type: 'game-event'; event: string; placementId: string } |
  ({ type: 'ad-request' } & Omit<AdRequest, 'requestId' | 'gameId'>) |
  { type: 'reward-granted'; adRequestId: string; placementId: string } |
  { type: PresentationEvent; placementId: string }
);
const id = (value: unknown): value is string => typeof value === 'string' && /^[a-z0-9][a-z0-9._:-]{0,79}$/i.test(value);
/** No wildcard origins, unknown fields, coercion, payload blobs, or DOM access. */
export function parseAdMessage(data: unknown, gameId: string): GameAdMessage | null {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
  const d = data as Record<string, unknown>;
  if (d.protocol !== AD_PROTOCOL || d.version !== AD_VERSION || d.gameId !== gameId || !id(d.requestId)) return null;
  let extra: string[];
  switch (d.type) {
    case 'game-ready':
      if (d.presentationVersion !== undefined && d.presentationVersion !== 1) return null;
      extra = ['presentationVersion']; break;
    case 'game-state':
      if (typeof d.state !== 'string' || !['menu', 'playing', 'paused', 'game-over'].includes(d.state)) return null;
      extra = ['state']; break;
    case 'game-event':
      if (!id(d.event) || !id(d.placementId)) return null;
      extra = ['event', 'placementId']; break;
    case 'ad-request':
      if (typeof d.adType !== 'string' || !['startup', 'interstitial', 'rewarded'].includes(d.adType) || !id(d.placementId)) return null;
      if (d.userInitiated !== undefined && typeof d.userInitiated !== 'boolean') return null;
      if (d.safeEvent !== undefined && !id(d.safeEvent)) return null;
      if (d.runId !== undefined && !id(d.runId)) return null;
      extra = ['adType', 'placementId', 'userInitiated', 'safeEvent', 'runId']; break;
    case 'reward-granted':
      if (!id(d.adRequestId) || !id(d.placementId)) return null;
      extra = ['adRequestId', 'placementId']; break;
    case 'ad-presentation-ready': case 'ad-courtesy-started': case 'ad-presentation-shown':
    case 'ad-presentation-completed': case 'ad-presentation-closed': case 'ad-presentation-failed':
      if (!id(d.placementId)) return null;
      extra = ['placementId']; break;
    default: return null;
  }
  if (Object.keys(d).some((key) => !['protocol', 'version', 'type', 'requestId', 'gameId', ...extra].includes(key))) return null;
  return d as GameAdMessage;
}

export function createAdBridge(service: AdService, context: {
  origin: string; source: unknown; gameId: string; send: (message: Record<string, unknown>) => void; presentation?: GamePresentationBroker;
}): { receive: (event: { origin: string; source: unknown; data: unknown }) => void; dispose: () => void } {
  let alive = true;
  const seen = new Set<string>();
  const pending = new Set<string>();
  const receipts = new Set<string>();
  const send = (type: string, values: Record<string, unknown>) => {
    if (alive) context.send({ protocol: AD_PROTOCOL, version: AD_VERSION, type, gameId: context.gameId, ...values });
  };
  const unsubscribe = service.subscribe((event) => {
    if (!event.requestId || !pending.has(event.requestId) || event.gameId !== context.gameId) return;
    if (['ad-accepted', 'ad-blocked', 'ad-will-show', 'ad-shown'].includes(event.event)) {
      send(event.event, { requestId: event.requestId, placementId: event.placementId, adType: event.adType, reason: event.reason });
    }
  });
  return {
    receive(event) {
      if (!alive || !context.source || event.origin !== context.origin || event.source !== context.source) return;
      const message = parseAdMessage(event.data, context.gameId);
      if (!message) return;
      if (['ad-presentation-ready', 'ad-courtesy-started', 'ad-presentation-shown', 'ad-presentation-completed', 'ad-presentation-closed', 'ad-presentation-failed'].includes(message.type)) { context.presentation?.receive(message as PresentationMessage); return; }
      if (seen.has(message.requestId) || seen.size >= 2000) return;
      seen.add(message.requestId);
      if (message.type === 'game-ready') { context.presentation?.ready(context.gameId, message.presentationVersion); service.emit('game-ready'); send('bridge-ready', { requestId: message.requestId, presentationVersion: 1 }); return; }
      if (message.type === 'game-state') { service.setGameState(message.state); return; }
      if (message.type === 'reward-granted') {
        if (receipts.has(message.adRequestId) && service.acknowledge(message.adRequestId, context.gameId, message.placementId)) receipts.delete(message.adRequestId);
        return;
      }
      if (message.type !== 'game-event' && message.type !== 'ad-request') return;
      const request: AdRequest = message.type === 'game-event'
        ? { requestId: message.requestId, gameId: message.gameId, placementId: message.placementId, adType: 'interstitial', safeEvent: message.event }
        : { requestId: message.requestId, gameId: message.gameId, placementId: message.placementId, adType: message.adType, userInitiated: message.userInitiated, safeEvent: message.safeEvent, runId: message.runId };
      if (message.type === 'game-event') service.emit('safe-event', request, undefined, message.event);
      pending.add(request.requestId);
      void service.request(request).then((response) => {
        if (alive && response.rewardQualified) receipts.add(request.requestId);
        send('ad-result', { ...response });
        pending.delete(request.requestId);
      });
    },
    dispose() { alive = false; unsubscribe(); context.presentation?.unbind(context.gameId); pending.clear(); receipts.clear(); seen.clear(); },
  };
}
