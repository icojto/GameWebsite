import { BANNER_SLOTS, DEFAULT_CONFIG, emptyCounters, normalizeConfig } from './model.ts';
import type { AdEvent, AdProvider, AdRequest, AdResponse, AdResult, AdState, AdType, Counters, GameState, Placement } from './model.ts';

type Options = { development?: boolean; now?: () => number; timeoutMs?: number };
export class AdService {
  config = structuredClone(DEFAULT_CONFIG);
  state: AdState = 'idle';
  gameId: string | null = null;
  gameState: GameState = 'unknown';
  visible = true;
  activeSeconds = 0;
  startup = { requested: false, shown: false, completed: false };
  stats: Record<AdType, Counters> = { startup: emptyCounters(), interstitial: emptyCounters(), rewarded: emptyCounters(), banner: emptyCounters() };
  placementStats = new Map<string, Counters>();
  events: AdEvent[] = [];
  placements = new Map<string, Placement>();
  blockedReasons: Record<string, number> = {};
  eligibleEvents = 0;
  rewardAcknowledgments = 0;
  interstitialCount = 0;
  rewardedCount = 0;
  bannerVisible = false;
  bannerHost: HTMLElement | null = null;
  lastError: string | null = null;
  lastRequest: AdRequest | null = null;
  lastResults: Partial<Record<AdType, { result: AdResult; reason?: string }>> = {};
  lastFullscreen: number | null = null;
  interstitialCooldownAt: number | null = null;
  lastInterstitial: number | null = null;
  lastRewarded: number | null = null;
  nextEligibleAt: number;
  private listeners = new Set<(event: AdEvent) => void>();
  private now: () => number;
  private started: number;
  private lastTick: number;
  private active: AbortController | null = null;
  private previouslyEligible = false;
  private usedIds = new Set<string>();
  private rewardReceipts = new Map<string, { gameId: string; placementId: string; acknowledged: boolean }>();
  private placementHistory = new Map<string, { shown: number; at: number }>();
  private placementRunHistory = new Map<string, number>();
  private placementRunCeilings = new Map<string, number>();
  private options: Options;
  provider: AdProvider;

  constructor(provider: AdProvider, options: Options = {}) {
    this.provider = provider;
    this.options = options;
    this.now = options.now ?? (() => performance.now());
    this.started = this.lastTick = this.now();
    this.nextEligibleAt = this.config.interstitial.firstSeconds;
  }
  get busy(): boolean { return this.active !== null; }
  get sessionAdsShown(): number { return [...this.placementHistory.values()].reduce((total, value)=>total+value.shown,0); }
  /** Read-only safety history; observation resets do not replenish an attempt. */
  rewardAttempt(id: string, runId?: string): { used: number | null; remaining: number | null } {
    const placement=this.placements.get(id);
    if(!placement || placement.maxPerRun===undefined || !runId)return {used:null,remaining:null};
    const used=this.placementRunHistory.get(`${id}:${runId}`) ?? 0;
    return {used,remaining:Math.max(0,placement.maxPerRun-used)};
  }
  /** Policy/readiness diagnostics, separate from historical observations. */
  describe(type: AdType, rendererReady: boolean): Record<string,string | number> {
    if(type==='banner') return { Current: !this.providerReady(type)?'UNAVAILABLE':this.bannerVisible?'VISIBLE':'HIDDEN', Reason:'Website slot; local display observations only', Shown:this.stats.banner.shown };
    const last=this.lastResults[type];
    const lastLabel=last?.result==='closed' ? last.reason==='player-skip'?'SKIPPED':'CLOSED/CANCELLED' : last?.result.toUpperCase().replace('_',' ') ?? 'NONE';
    let current='WAITING',reason='Awaiting explicit player request';
    const cfg=this.config[type];
    if(this.busy && this.lastRequest?.adType===type){current=this.state.toUpperCase();reason='Active request; wait for lifecycle result';}
    else if(!this.config.master || !cfg.enabled){current='OFF';reason='Disabled by master or type switch';}
    else if(!this.gameId || !this.providerReady(type) || !rendererReady){current='UNAVAILABLE';reason=!this.gameId?'Open a game page':!rendererReady?'Game renderer unavailable':'Provider unavailable';}
    else if(this.busy){reason='another-ad-active';}
    else if(!this.visible){reason='document-hidden';}
    else if(type==='interstitial') {const check=this.interstitialEligibility();current=check.eligible?'ELIGIBLE':'WAITING';reason=check.reason;}
    else if(type==='startup') {reason=this.config.startup.oncePerSession && this.startup.requested?'Used this session / waiting for next session':'Awaiting applicable start request';}
    else if(this.rewardedCount>=this.config.rewarded.maxPerSession) reason='session-cap';
    else if(this.lastRewarded!==null && (this.secondsSince(this.lastRewarded)??0)<this.config.rewarded.cooldownSeconds) reason='rewarded-cooldown';
    const result:Record<string,string|number>={Current:current,Reason:reason,'Last result':lastLabel,'Last reason':last?.reason??'none',Shown:this.stats[type].shown,Completed:this.stats[type].completed};
    const placements=[...this.placements.values()].filter(p=>p.gameId===this.gameId && p.adType===type && !p.id.startsWith('dev-'));
    result['Placement restrictions']=placements.map(p=>{
      const history=this.placementHistory.get(p.id);
      const blocked=!p.enabled?'disabled':p.sessionLimitEnabled!==false && (history?.shown??0)>=p.maxPerSession?'placement-cap':history && (this.secondsSince(history.at)??0)<p.cooldownSeconds?'placement-cooldown':'';
      return blocked?`${p.id}: ${blocked}`:'';
    }).filter(Boolean).join('; ') || 'Checked on request (including run context)';
    if(type==='interstitial') {result['Active-play wait seconds']=Math.ceil(Math.max(0,this.nextEligibleAt-this.activeSeconds));result['Cooldown remaining seconds']=this.interstitialCooldownAt===null?0:Math.ceil(Math.max(0,this.config.interstitial.cooldownSeconds-(this.secondsSince(this.interstitialCooldownAt)??0)));result['Session cap']=this.config.interstitial.sessionLimitEnabled?this.config.interstitial.maxPerSession:'Unlimited';}
    if(type==='rewarded') result['Rewards acknowledged']=this.rewardAcknowledgments;
    return result;
  }
  capabilities(gameId: string): { providerMode: 'mock' | 'null' | 'real'; fullscreenAvailable: boolean; rewardedAvailable: boolean; startupDue: boolean } {
    const mode = this.provider.name === 'MOCK' ? 'mock' : this.provider.name === 'NULL' ? 'null' : 'real';
    const available = this.config.master && mode !== 'null';
    const placements = [...this.placements.values()].filter((p) => p.gameId === gameId && !p.id.startsWith('dev-') && p.enabled && p.maxPerRun !== 0 && (p.sessionLimitEnabled === false || p.maxPerSession > (this.placementHistory.get(p.id)?.shown ?? 0)));
    return {
      providerMode: mode,
      fullscreenAvailable: available && (this.providerReady('startup') || this.providerReady('interstitial')),
      rewardedAvailable: available && this.config.rewarded.enabled && this.providerReady('rewarded') && this.rewardedCount < this.config.rewarded.maxPerSession && placements.some((p) => p.adType === 'rewarded'),
      startupDue: available && this.config.startup.enabled && (!this.config.startup.oncePerSession || !this.startup.requested) && this.providerReady('startup') && placements.some((p) => p.adType === 'startup'),
    };
  }
  tunePlacement(id: string, values: Partial<Pick<Placement, 'enabled' | 'cooldownSeconds' | 'maxPerSession' | 'maxPerRun' | 'sessionLimitEnabled'>>): void {
    if (!this.options.development || this.busy) return;
    const placement = this.placements.get(id);
    if (!placement) return;
    if (typeof values.enabled === 'boolean') placement.enabled = values.enabled;
    if (placement.adType === 'interstitial' && typeof values.sessionLimitEnabled === 'boolean') placement.sessionLimitEnabled = values.sessionLimitEnabled;
    for (const key of ['cooldownSeconds', 'maxPerSession', 'maxPerRun'] as const) {
      const value = values[key];
      if (typeof value === 'number' && Number.isFinite(value) && (key !== 'maxPerRun' || placement.maxPerRun !== undefined)) {
        // Designer tuning cannot widen a placement's declared engineering ceiling.
        const ceiling = key === 'cooldownSeconds' ? 86400 : key === 'maxPerRun' ? this.placementRunCeilings.get(id) ?? 0 : 100;
        placement[key] = Math.round(Math.max(0, Math.min(ceiling, value)));
      }
    }
    this.emit('placement-configured', { placementId: id });
  }
  private providerReady(type: AdType): boolean {
    try { return this.provider.isReady(type); }
    catch { this.lastError = 'provider-readiness-failed'; return false; }
  }
  get sessionSeconds(): number { return Math.max(0, (this.now() - this.started) / 1000); }
  secondsSince(value: number | null): number | null { return value === null ? null : Math.max(0, (this.now() - value) / 1000); }
  subscribe(listener: (event: AdEvent) => void): () => void { this.listeners.add(listener); return () => this.listeners.delete(listener); }
  emit(event: string, request?: Partial<AdRequest>, result?: AdResult, reason?: string): void {
    const entry: AdEvent = { timestamp: new Date().toISOString(), event, gameId: request?.gameId ?? this.gameId, ...request, result, reason, activeSeconds: this.activeSeconds, sessionSeconds: this.sessionSeconds };
    this.events.push(entry);
    if (this.events.length > 200) this.events.shift();
    for (const listener of this.listeners) { try { listener(entry); } catch { /* Observers cannot hold an ad request open. */ } }
  }
  configure(input: unknown): void {
    const previousFirst = this.config.interstitial.firstSeconds;
    this.config = normalizeConfig(input);
    if (!this.interstitialCount && this.nextEligibleAt === previousFirst) this.nextEligibleAt = this.config.interstitial.firstSeconds;
    if (!this.config.master) this.cancelActive('disabled');
    if (!this.config.master || !this.config.banner.enabled) this.setBanner(false);
    this.tick();
    this.emit('ads-configured');
  }
  register(placement: Placement): void {
    if (!/^[a-z0-9][a-z0-9._-]{0,79}$/i.test(placement.id) || !placement.gameId || this.placements.size >= 100
      || (placement.maxPerRun !== undefined && (!Number.isInteger(placement.maxPerRun) || placement.maxPerRun < 0 || placement.maxPerRun > 100))) throw new Error('Invalid placement registration');
    this.placements.set(placement.id, structuredClone(placement));
    if (placement.maxPerRun !== undefined) this.placementRunCeilings.set(placement.id, placement.maxPerRun);
  }
  setContext(gameId: string | null): void {
    this.tick();
    this.cancelActive('route-changed');
    this.gameId = gameId;
    this.gameState = 'unknown';
    this.emit('game-context');
  }
  setGameState(state: GameState): void { this.tick(); this.gameState = state; this.emit('game-state', undefined, undefined, state); }
  setVisible(visible: boolean): void { this.tick(); this.visible = visible; this.emit('visibility', undefined, undefined, visible ? 'visible' : 'hidden'); }
  tick(): void {
    const now = this.now();
    if (this.gameId && this.gameState === 'playing' && this.visible && !this.busy) this.activeSeconds += Math.max(0, (now - this.lastTick) / 1000);
    this.lastTick = now;
    const eligible = this.interstitialEligibility().eligible;
    if (eligible && !this.previouslyEligible) { this.eligibleEvents++; this.emit('interstitial-eligible'); }
    this.previouslyEligible = eligible;
  }
  interstitialEligibility(safeEvent?: string, placement?: Placement): { eligible: boolean; reason: string; secondsRemaining: number } {
    const cfg = this.config.interstitial;
    const remaining = Math.max(0, this.nextEligibleAt - this.activeSeconds);
    const reason = !this.config.master || !cfg.enabled ? 'disabled' : this.busy ? 'another-ad-active'
      : cfg.sessionLimitEnabled && this.interstitialCount >= cfg.maxPerSession ? 'session-cap'
      : remaining > 0 ? 'not-enough-active-play'
      : this.interstitialCooldownAt !== null && (this.secondsSince(this.interstitialCooldownAt) ?? 0) < cfg.cooldownSeconds ? 'cooldown'
      : !this.providerReady('interstitial') ? 'provider-unavailable'
      : placement && (!safeEvent || !placement.safeEvents?.includes(safeEvent)) ? 'no-safe-event' : '';
    return { eligible: !reason, reason: reason || 'eligible-awaiting-safe-event', secondsRemaining: remaining };
  }
  private count(type: AdType, field: keyof Counters, placementId?: string): void {
    this.stats[type][field]++;
    if (placementId) {
      const counters = this.placementStats.get(placementId) ?? emptyCounters();
      counters[field]++;
      this.placementStats.set(placementId, counters);
    }
  }
  private finish(request: AdRequest, result: AdResult, reason?: string, shown = false): AdResponse {
    this.lastResults[request.adType] = { result, reason };
    this.count(request.adType, result, request.placementId);
    if (result === 'blocked' && request.adType === 'interstitial') this.blockedReasons[reason ?? 'unknown'] = (this.blockedReasons[reason ?? 'unknown'] ?? 0) + 1;
    if (result === 'failed' || result === 'timeout') this.lastError = reason ?? result;
    const rewardQualified = shown && request.adType === 'rewarded' && result === 'completed';
    if (rewardQualified) this.rewardReceipts.set(request.requestId, { gameId: request.gameId, placementId: request.placementId, acknowledged: false });
    this.emit(result === 'blocked' ? 'ad-blocked' : 'ad-result', request, result, reason);
    return { ...request, result, rewardQualified, reason };
  }
  async request(request: AdRequest, force = false): Promise<AdResponse> {
    this.tick();
    this.count(request.adType, 'requests', request.placementId);
    this.emit('ad-request', request);
    const placement = this.placements.get(request.placementId);
    const history = this.placementHistory.get(request.placementId);
    const runKey = request.runId ? `${request.placementId}:${request.runId}` : '';
    let reason = this.usedIds.has(request.requestId) ? 'duplicate-request' : this.usedIds.size >= 2000 ? 'request-limit'
      : request.gameId !== this.gameId ? 'wrong-game'
      : !placement || placement.gameId !== request.gameId || placement.adType !== request.adType ? 'unknown-placement'
      : !this.config.master || !placement.enabled ? 'disabled'
      : this.busy ? 'another-ad-active'
      : !this.visible ? 'document-hidden'
      : placement.sessionLimitEnabled !== false && (history?.shown ?? 0) >= placement.maxPerSession ? 'placement-cap'
      : placement.maxPerRun !== undefined && !request.runId ? 'run-context-required'
      : placement.maxPerRun !== undefined && (this.placementRunHistory.get(runKey) ?? 0) >= placement.maxPerRun ? 'placement-run-cap'
      : history && (this.secondsSince(history.at) ?? 0) < placement.cooldownSeconds ? 'placement-cooldown' : '';
    if (reason) return this.finish(request, 'blocked', reason);
    this.usedIds.add(request.requestId);
    const bypass = force && this.options.development;
    if (request.adType === 'startup') {
      if (!this.config.startup.enabled) reason = 'disabled';
      else if (this.config.startup.oncePerSession && this.startup.requested) reason = 'startup-once-per-session';
    } else if (request.adType === 'interstitial' && !bypass) {
      const check = this.interstitialEligibility(request.safeEvent, placement);
      if (!check.eligible) reason = check.reason;
    } else if (request.adType === 'rewarded') {
      reason = !request.userInitiated ? 'explicit-request-required' : !this.config.rewarded.enabled ? 'disabled'
        : this.rewardedCount >= this.config.rewarded.maxPerSession ? 'session-cap'
        : this.lastRewarded !== null && (this.secondsSince(this.lastRewarded) ?? 0) < this.config.rewarded.cooldownSeconds ? 'rewarded-cooldown' : '';
    }
    if (reason) return this.finish(request, reason === 'provider-unavailable' ? 'unavailable' : 'blocked', reason);
    if (request.adType === 'startup') this.startup.requested = true;
    if (!this.providerReady(request.adType)) return this.finish(request, 'unavailable', 'provider-unavailable');
    const controller = new AbortController();
    this.active = controller;
    this.lastRequest = request;
    this.state = 'requested';
    this.count(request.adType, 'accepted', request.placementId);
    this.emit('ad-accepted', request);
    let shown = false;
    const timer = setTimeout(() => controller.abort('timeout'), this.options.timeoutMs ?? 30000);
    let result: AdResult = 'failed';
    try {
      this.state = 'preparing';
      const prepared = await abortable(this.provider.prepareAd(request, controller.signal), controller.signal);
      if (prepared !== 'ready') { result = prepared === 'completed' ? 'failed' : prepared; }
      else {
        this.state = 'ready';
        this.count(request.adType, 'prepared', request.placementId);
        this.emit('provider-ready', request);
        // Pause contract precedes courtesy and showing. No preparation failure pauses a game.
        this.emit('ad-will-show', request);
        const outcome = await abortable(this.provider.showAd(request, controller.signal, () => {
          if (controller.signal.aborted || shown) return;
          shown = true;
          this.state = 'showing';
          this.count(request.adType, 'shown', request.placementId);
          this.placementHistory.set(request.placementId, { shown: (history?.shown ?? 0) + 1, at: this.now() });
          if (runKey) this.placementRunHistory.set(runKey, (this.placementRunHistory.get(runKey) ?? 0) + 1);
          if (request.adType === 'startup') this.startup.shown = true;
          if (request.adType === 'interstitial') { this.interstitialCount++; this.lastInterstitial = this.now(); this.nextEligibleAt = this.activeSeconds + this.config.interstitial.intervalSeconds; }
          if (request.adType === 'rewarded') { this.rewardedCount++; this.lastRewarded = this.now(); }
          this.emit('ad-shown', request);
        }), controller.signal);
        result = typeof outcome === 'string' ? outcome : outcome.result;
        if (typeof outcome !== 'string') reason = outcome.reason ?? '';
        if (result === 'completed' && !shown) result = 'failed';
      }
    } catch (error) {
      result = controller.signal.aborted ? controller.signal.reason === 'timeout' ? 'timeout' : 'closed' : error instanceof Error && error.message === 'closed' ? 'closed' : 'failed';
    } finally {
      clearTimeout(timer);
      controller.abort('finished');
      this.lastTick = this.now();
      if (shown) this.lastFullscreen = this.now();
      if (shown && (request.adType !== 'rewarded' || this.config.interstitial.resetAfterRewarded)) {
        this.interstitialCooldownAt = this.now();
        this.emit('cooldown-reset', request);
      }
      if (shown && request.adType === 'rewarded') this.lastRewarded = this.now();
      this.active = null;
    }
    if (request.adType === 'startup' && result === 'completed') this.startup.completed = true;
    this.state = result === 'completed' ? 'completed' : result === 'closed' ? 'closed' : 'failed';
    return this.finish(request, result, reason || (controller.signal.reason === 'finished' ? undefined : String(controller.signal.reason)), shown);
  }
  acknowledge(requestId: string, gameId: string, placementId: string): boolean {
    const receipt = this.rewardReceipts.get(requestId);
    if (!receipt || receipt.acknowledged || receipt.gameId !== gameId || receipt.placementId !== placementId) return false;
    receipt.acknowledged = true;
    this.rewardAcknowledgments++;
    this.emit('reward-granted', { requestId, gameId, placementId, adType: 'rewarded' });
    return true;
  }
  attachBanner(host: HTMLElement | null): void { this.setBanner(false); this.bannerHost = host; if (this.config.banner.enabled) this.setBanner(true); }
  setBanner(visible: boolean): void {
    const host = this.bannerHost;
    if (!host) return;
    if (!visible || !this.config.master || !this.config.banner.enabled) {
      try { this.provider.hideBanner(host); } catch { this.lastError = 'banner-hide-failed'; }
      host.hidden = true; this.bannerVisible = false; return;
    }
    if (this.bannerVisible) return;
    this.count('banner', 'requests');
    if (!this.providerReady('banner')) { this.count('banner', 'unavailable'); return; }
    try {
      this.bannerVisible = this.provider.showBanner(BANNER_SLOTS.primary, host);
      host.hidden = !this.bannerVisible;
      if (this.bannerVisible) { this.count('banner', 'accepted'); this.count('banner', 'prepared'); this.count('banner', 'shown'); this.emit('banner-shown', { placementId: BANNER_SLOTS.primary }); }
    } catch { this.count('banner', 'failed'); host.hidden = true; this.bannerVisible = false; }
  }
  cancelActive(reason = 'cancelled'): void { this.active?.abort(reason); }
  devAction(action: 'eligible' | 'timer' | 'cooldown' | 'startup'): void {
    if (!this.options.development || this.busy) return;
    if (action === 'eligible') this.nextEligibleAt = this.activeSeconds;
    if (action === 'timer') this.nextEligibleAt = this.activeSeconds + this.config.interstitial.firstSeconds;
    if (action === 'cooldown') this.interstitialCooldownAt = null;
    if (action === 'startup') this.startup = { requested: false, shown: false, completed: false };
    this.tick();
    this.emit(`dev-reset-${action}`);
  }
  clearStats(): void {
    this.lastResults = {};
    for (const type of Object.keys(this.stats) as AdType[]) this.stats[type] = emptyCounters();
    this.placementStats.clear(); this.events = []; this.blockedReasons = {}; this.eligibleEvents = 0; this.rewardAcknowledgments = 0;
    this.emit('stats-cleared', undefined, undefined, 'Eligibility, caps and reward receipts are retained');
  }
  destroy(): void { this.cancelActive('destroyed'); this.setBanner(false); this.provider.destroy(); this.listeners.clear(); }
}

/** A broken future provider must still settle within the host deadline/cancellation. */
function abortable<T>(promise: Promise<T>, signal: AbortSignal): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const abort = () => reject(new Error('aborted'));
    if (signal.aborted) return abort();
    signal.addEventListener('abort', abort, { once: true });
    promise.then(resolve, reject).finally(() => signal.removeEventListener('abort', abort));
  });
}
