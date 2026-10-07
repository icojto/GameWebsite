import type { AdService } from '../service.ts';
import type { AdEvent } from '../model.ts';
export const MVP_EVENT_LIMIT = 8;
export function conciseEvents(events: readonly AdEvent[]): string[] {
  return events.slice(-MVP_EVENT_LIMIT).reverse().map(entry =>
    `${entry.timestamp.slice(11,19)} ${entry.event.replace(/^ad-/, '')} ${entry.placementId ?? ''}${entry.result ? ' · '+entry.result : ''}${entry.reason ? ' · '+entry.reason : ''}`.trim());
}
export function mvpStatus(service: AdService, renderer: boolean): Record<string,string> {
  const eligibility=service.interstitialEligibility();
  const last=[...service.events].reverse().find(e=>e.event==='ad-result' || e.event==='ad-blocked');
  return {
    'Mode / Provider': service.provider.name,
    'Current game': service.gameId ?? 'Open a game',
    'Renderer': renderer ? 'Connected' : 'Disconnected',
    'Game state': service.gameState,
    'Ad state': service.state,
    'Last result': last ? `${last.placementId ?? last.adType}: ${last.result}${last.reason ? ' / '+last.reason : ''}` : 'None',
    'Active play time': `${Math.floor(service.activeSeconds)}s`,
    'Session ads shown': String(service.sessionAdsShown),
    'Interstitial eligibility': !renderer ? 'Blocked' : eligibility.eligible ? 'Eligible' : 'Blocked',
    'Block reason': !renderer ? 'renderer-disconnected' : eligibility.eligible ? 'None — awaiting an approved safe event' : eligibility.reason,
  };
}
