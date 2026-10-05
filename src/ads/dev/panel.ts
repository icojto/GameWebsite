import './styles.css';
import { siteStorage } from '../../site/storage.mjs';
import { AdService } from '../service.ts';
import { DEFAULT_CONFIG, normalizeConfig } from '../model.ts';
import type { AdRequest, FullscreenType, GameState } from '../model.ts';
import { MockAdAdapter } from './mock-adapter.ts';
import { DevAdOverlay } from './overlay.ts';

const STORAGE_KEY = 'odesos.dev.ads.v1';
export interface DevTools { service: AdService; attachFrame(frame: HTMLIFrameElement | null): void; destroy(): void }

export async function createDevTools(): Promise<DevTools> {
  const overlay = new DevAdOverlay();
  let stored: unknown;
  try { stored = JSON.parse(siteStorage.get(STORAGE_KEY) ?? 'null'); } catch { stored = null; }
  const provider = new MockAdAdapter(() => service.config, () => {
    service.config.mock.nextResult = 'completed'; persist(); syncInputs();
  }, overlay);
  const service = new AdService(provider, { development: true, courtesy: (request, config, signal) => overlay.courtesy(request.adType, config, signal) });
  service.configure(normalizeConfig(stored));
  await provider.initialize();
  const panel = document.createElement('dialog'); panel.className = 'odesos-ad-dev'; panel.setAttribute('aria-labelledby', 'odesos-ad-dev-title');
  const header = document.createElement('header');
  const title = document.createElement('h2'); title.id = 'odesos-ad-dev-title'; title.textContent = 'ODESOS AD DEV';
  const close = document.createElement('button'); close.textContent = 'Close'; close.type = 'button'; close.setAttribute('aria-label', 'Close Odesos Ad Dev'); header.append(title, close);
  const notice = document.createElement('p'); notice.textContent = 'Mock tooling · This tab/session only · PROVIDER COMPLIANCE NOT YET REVIEWED';
  const feedback = document.createElement('p'); feedback.className = 'ad-dev-feedback'; feedback.setAttribute('role', 'status'); feedback.textContent = 'Open a game page to test. Games are not connected to ads yet.';
  const content = document.createElement('div'); content.className = 'ad-dev-scroll'; panel.append(header, notice, feedback, content);
  const trigger = document.createElement('button'); trigger.className = 'odesos-ad-dev-trigger'; trigger.type = 'button'; trigger.textContent = 'AD DEV'; trigger.setAttribute('aria-label', 'Open website Ad Dev Panel');
  document.body.append(trigger, panel);
  let previousFocus: HTMLElement | null = null;
  const openPanel = () => { if (overlay.busy) return; if (panel.open) panel.close(); else { previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : trigger; panel.showModal(); close.focus(); refresh(); } };
  trigger.addEventListener('click', openPanel); close.addEventListener('click', () => panel.close());
  panel.addEventListener('close', () => { if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true }); });
  const key = (event: KeyboardEvent) => { if (event.ctrlKey && event.shiftKey && event.code === 'KeyA') { event.preventDefault(); event.stopPropagation(); openPanel(); } };
  window.addEventListener('keydown', key, true);
  let childWindow: Window | null = null;
  function attachFrame(frame: HTMLIFrameElement | null): void {
    try { childWindow?.removeEventListener('keydown', key, true); childWindow = frame?.contentWindow ?? null; childWindow?.addEventListener('keydown', key, true); } catch { childWindow = null; }
  }
  const fields = new Map<string, HTMLInputElement | HTMLSelectElement>();
  function section(name: string): HTMLElement {
    const details = document.createElement('details'); details.open = true;
    const summary = document.createElement('summary'); summary.textContent = name; details.append(summary); content.append(details); return details;
  }
  function paragraph(parent: HTMLElement, text: string): void { const p = document.createElement('p'); p.textContent = text; parent.append(p); }
  function output(parent: HTMLElement): HTMLPreElement { const el = document.createElement('pre'); parent.append(el); return el; }
  function action(parent: HTMLElement, label: string, run: () => void | Promise<void>): void {
    const button = document.createElement('button'); button.type = 'button'; button.textContent = label;
    button.addEventListener('click', () => { void Promise.resolve().then(run).catch(() => { feedback.textContent = 'Test cancelled or unavailable. No gameplay reward was granted.'; }); }); parent.append(button);
  }
  function configValue(path: string): unknown { return path.split('.').reduce<unknown>((value, key) => (value as Record<string, unknown>)[key], service.config); }
  function change(path: string, value: unknown): void {
    const copy = structuredClone(service.config) as unknown as Record<string, unknown>;
    const parts = path.split('.'); let object = copy;
    for (const part of parts.slice(0, -1)) object = object[part] as Record<string, unknown>;
    object[parts.at(-1)!] = value; service.configure(copy); persist(); syncInputs();
    if (path === 'banner.enabled') service.setBanner(Boolean(value));
    refresh();
  }
  function field(parent: HTMLElement, path: string, label: string, options?: [string, string][]): void {
    const wrapper = document.createElement('label'); wrapper.className = 'ad-dev-field';
    const span = document.createElement('span'); span.textContent = label; wrapper.append(span);
    let control: HTMLInputElement | HTMLSelectElement;
    if (options) {
      const select = document.createElement('select');
      for (const [value, text] of options) { const option = document.createElement('option'); option.value = value; option.textContent = text; select.append(option); }
      control = select;
    } else { const input = document.createElement('input'); input.type = typeof configValue(path) === 'boolean' ? 'checkbox' : 'number'; if (input.type === 'number') { input.min = '0'; input.step = '1'; } control = input; }
    control.addEventListener('change', () => change(path, control instanceof HTMLInputElement ? control.type === 'checkbox' ? control.checked : Number(control.value) : control.value));
    fields.set(path, control); wrapper.append(control); parent.append(wrapper);
  }
  function persist(): void { siteStorage.set(STORAGE_KEY, JSON.stringify(service.config)); }
  function syncInputs(): void {
    for (const [path, control] of fields) { const value = configValue(path); if (control instanceof HTMLInputElement && control.type === 'checkbox') control.checked = Boolean(value); else control.value = String(value); }
  }
  function ensurePlacements(): void {
    if (!service.gameId) return;
    for (const adType of ['startup', 'interstitial', 'rewarded'] as const) {
      const id = `dev-${service.gameId}-${adType}`;
      if (!service.placements.has(id)) service.register({ id, gameId: service.gameId, adType, enabled: true, cooldownSeconds: 0, maxPerSession: 100, safeEvents: adType === 'interstitial' ? ['run-ended', 'restart-requested', 'new-game-requested'] : [] });
    }
  }
  async function testAd(adType: FullscreenType, safeEvent?: string, force = false): Promise<void> {
    if (!service.gameId) { feedback.textContent = 'Open a public game page first.'; return; }
    if (overlay.busy) { feedback.textContent = 'Another overlay is active.'; return; }
    ensurePlacements();
    const request: AdRequest = { requestId: crypto.randomUUID(), gameId: service.gameId, placementId: `dev-${service.gameId}-${adType}`, adType, userInitiated: adType === 'rewarded', safeEvent };
    if (safeEvent) service.emit('safe-event', request, undefined, safeEvent);
    const result = await service.request(request, force);
    feedback.textContent = `${adType}: ${result.result}${result.reason ? ` (${result.reason})` : ''}. Reward qualified: ${result.rewardQualified ? 'YES' : 'NO'}. No game reward applied.`;
    refresh();
  }
  const overview = section('OVERVIEW'); field(overview, 'master', 'Ads master'); const overviewOutput = output(overview);
  const startup = section('STARTUP');
  field(startup, 'startup.enabled', 'Enabled'); field(startup, 'startup.oncePerSession', 'Once per session'); field(startup, 'startup.courtesy', 'Courtesy enabled');
  const startupOutput = output(startup); action(startup, 'TEST STARTUP', () => testAd('startup')); action(startup, 'RESET STARTUP', () => { service.devAction('startup'); refresh(); });
  const interstitial = section('INTERSTITIAL');
  field(interstitial, 'interstitial.enabled', 'Enabled'); field(interstitial, 'interstitial.firstSeconds', 'First eligible after active seconds'); field(interstitial, 'interstitial.intervalSeconds', 'Eligibility interval seconds');
  field(interstitial, 'interstitial.cooldownSeconds', 'Cooldown seconds'); field(interstitial, 'interstitial.maxPerSession', 'Maximum per session'); field(interstitial, 'interstitial.resetAfterRewarded', 'Reset cooldown after rewarded');
  paragraph(interstitial, 'Time only creates eligibility. A registered safe semantic event is required to show.');
  const interstitialOutput = output(interstitial);
  action(interstitial, 'MAKE ELIGIBLE', () => { service.devAction('eligible'); refresh(); });
  action(interstitial, 'RESET ELIGIBILITY TIMER', () => { service.devAction('timer'); refresh(); });
  action(interstitial, 'RESET COOLDOWN', () => { service.devAction('cooldown'); refresh(); });
  action(interstitial, 'SIMULATE SAFE EVENT (run-ended)', () => testAd('interstitial', 'run-ended'));
  action(interstitial, 'FORCE INTERSTITIAL — bypass eligibility', () => testAd('interstitial', undefined, true));
  const rewarded = section('REWARDED'); field(rewarded, 'rewarded.enabled', 'Rewarded master'); field(rewarded, 'rewarded.cooldownSeconds', 'Global rewarded cooldown seconds'); field(rewarded, 'rewarded.maxPerSession', 'Maximum per session'); field(rewarded, 'rewarded.courtesy', 'Courtesy enabled');
  paragraph(rewarded, 'Only completed qualifies. The game owns all rewards. Generic DEV placements have no gameplay reward.'); const rewardedOutput = output(rewarded);
  action(rewarded, 'TEST REWARDED GENERIC', () => testAd('rewarded'));
  const banner = section('BANNER'); field(banner, 'banner.enabled', 'game-page-primary enabled'); const bannerOutput = output(banner);
  action(banner, 'SHOW MOCK BANNER', () => change('banner.enabled', true)); action(banner, 'HIDE MOCK BANNER', () => change('banner.enabled', false));
  const courtesy = section('COURTESY'); field(courtesy, 'courtesy.enabled', 'Master enabled'); field(courtesy, 'courtesy.durationMs', 'Duration ms (400–2500)');
  for (const type of ['startup', 'interstitial', 'rewarded']) field(courtesy, `courtesy.${type}`, `${type} courtesy`);
  field(courtesy, 'courtesy.mascot', 'Mascot'); field(courtesy, 'courtesy.animation', 'Animation (respects reduced motion)'); field(courtesy, 'courtesy.preset', 'Message preset', [['friendly', 'Friendly'], ['concise', 'Concise']]);
  for (const type of ['startup', 'interstitial', 'rewarded'] as const) action(courtesy, `PREVIEW ${type.toUpperCase()}`, async () => {
    if (service.busy || overlay.busy) return;
    await overlay.courtesy(type, service.config.courtesy, new AbortController().signal);
  });
  const simulation = section('SIMULATION');
  const stateLabel = document.createElement('label'); stateLabel.textContent = 'Simulated game state (does not control game)';
  const stateSelect = document.createElement('select');
  for (const name of ['unknown', 'menu', 'playing', 'paused', 'game-over']) { const option = document.createElement('option'); option.value = name; option.textContent = name; stateSelect.append(option); }
  stateLabel.append(stateSelect); simulation.append(stateLabel); stateSelect.addEventListener('change', () => service.setGameState(stateSelect.value as GameState));
  field(simulation, 'mock.nextResult', 'Next result — one shot, then Complete', [['completed', 'Complete'], ['closed', 'Close early'], ['failed', 'Load error'], ['no_fill', 'No fill'], ['timeout', 'Timeout'], ['unavailable', 'Unavailable']]);
  field(simulation, 'mock.loadingMs', 'Mock loading delay ms (0–5000)'); field(simulation, 'mock.durationMs', 'Mock duration ms (500–15000)');
  action(simulation, 'TEST STARTUP', () => testAd('startup')); action(simulation, 'TEST INTERSTITIAL (safe event)', () => testAd('interstitial', 'run-ended'));
  action(simulation, 'TEST REWARDED GENERIC', () => testAd('rewarded')); action(simulation, 'TEST BANNER', () => change('banner.enabled', true));
  action(simulation, 'TEST FULL FLOW (startup)', async () => { service.devAction('startup'); await testAd('startup'); });
  const events = section('EVENTS'); const statsOutput = output(events); const logOutput = output(events);
  action(events, 'CLEAR SESSION STATS', () => { service.clearStats(); refresh(); }); paragraph(events, 'Clears observations only. Session caps, cooldowns, startup state and reward receipts remain in force. Reload starts a new session.');
  action(events, 'RESET DEFAULTS', () => { service.configure(DEFAULT_CONFIG); persist(); syncInputs(); refresh(); });
  function refresh(): void {
    if (!panel.open) return;
    const seconds = (value: number | null) => value === null ? 'never' : `${Math.floor(value)}s`;
    overviewOutput.textContent = `Provider: ${service.provider.name}\nCurrent game: ${service.gameId ?? 'NONE'}\nGame state: ${service.gameState}\nDocument visible: ${service.visible ? 'YES' : 'NO'}\nSession: ${seconds(service.sessionSeconds)}\nActive gameplay: ${seconds(service.activeSeconds)}\nAd state: ${service.state}\nAd showing: ${service.state === 'showing' ? 'YES' : 'NO'}\nRequest active: ${service.busy ? 'YES' : 'NO'}\nLast type: ${service.lastRequest?.adType ?? 'none'}\nLast placement: ${service.lastRequest?.placementId ?? 'none'}\nSince fullscreen: ${seconds(service.secondsSince(service.lastFullscreen))}\nShown this observation window: ${Object.values(service.stats).reduce((sum, counter) => sum + counter.shown, 0)}\nLast error: ${service.lastError ?? 'none'}`;
    startupOutput.textContent = Object.entries(service.startup).map(([key, value]) => `${key}: ${value ? 'YES' : 'NO'}`).join('\n');
    const eligibility = service.interstitialEligibility();
    interstitialOutput.textContent = `Eligible: ${eligibility.eligible ? 'YES' : 'NO'}\nReason: ${eligibility.reason}\nActive play: ${seconds(service.activeSeconds)}\nTime until threshold: ${seconds(eligibility.secondsRemaining)}\nSince interstitial: ${seconds(service.secondsSince(service.lastInterstitial))}\nCount/session: ${service.interstitialCount}\nSafe events: ${[...new Set([...service.placements.values()].filter((p) => p.gameId === service.gameId).flatMap((p) => p.safeEvents ?? []))].join(', ') || 'none'}`;
    rewardedOutput.textContent = [...service.placements.values()].filter((p) => p.adType === 'rewarded').map((p) => `${p.id}\nGame: ${p.gameId} · enabled: ${p.enabled}\nCooldown: ${p.cooldownSeconds}s · cap: ${p.maxPerSession}\n${JSON.stringify(service.placementStats.get(p.id) ?? {})}`).join('\n\n') || 'No placements registered.';
    const size = service.bannerHost?.getBoundingClientRect();
    bannerOutput.textContent = `Visible: ${service.bannerVisible ? 'YES' : 'NO'}\nImpressions: ${service.stats.banner.shown}\nDimensions: ${Math.round(size?.width ?? 0)} × ${Math.round(size?.height ?? 0)}\nWebsite slot outside iframe`;
    const totals = Object.values(service.stats); const prepared = totals.reduce((sum, x) => sum + x.prepared, 0); const accepted = totals.reduce((sum, x) => sum + x.accepted, 0);
    statsOutput.textContent = `${JSON.stringify(service.stats, null, 2)}\nInterstitial eligibility events: ${service.eligibleEvents}\nBlocked reasons: ${JSON.stringify(service.blockedReasons)}\nRewarded completion: ${service.stats.rewarded.shown ? Math.round(100 * service.stats.rewarded.completed / service.stats.rewarded.shown) : 0}%\nProvider preparation success: ${accepted ? Math.round(100 * prepared / accepted) : 0}%\nReward acknowledgments: ${service.rewardAcknowledgments}`;
    logOutput.textContent = service.events.slice(-60).reverse().map((entry) => `${entry.timestamp.slice(11, 19)} ${entry.event} ${entry.adType ?? ''} ${entry.result ?? ''}\n${entry.gameId ?? 'NONE'} ${entry.placementId ?? ''} ${entry.reason ?? ''}\nactive ${Math.floor(entry.activeSeconds)}s / session ${Math.floor(entry.sessionSeconds)}s`).join('\n\n');
    if (document.activeElement !== stateSelect) stateSelect.value = service.gameState;
  }
  const unsubscribe = service.subscribe((event) => { if (event.event === 'game-context') ensurePlacements(); refresh(); });
  const interval = window.setInterval(refresh, 500);
  syncInputs();
  return { service, attachFrame, destroy() { clearInterval(interval); unsubscribe(); attachFrame(null); window.removeEventListener('keydown', key, true); overlay.destroy(); panel.remove(); trigger.remove(); } };
}
