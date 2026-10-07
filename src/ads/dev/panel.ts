import { mountInspection } from '../../../shared/dev/inspection.ts';
import './styles.css';
import '../../../shared/dev/help.css';
import { ContextHelp } from '../../../shared/dev/help.ts';
import { fieldHelp, actionHelp, READOUT_HELP } from './help.ts';
import { STORAGE_KEY, loadDevSettings, devPlacement } from './settings.ts';
import { siteStorage } from '../../site/storage.mjs';
import { AdService } from '../service.ts';
import { DEFAULT_CONFIG, configBounds } from '../model.ts';
import type { AdRequest, FullscreenType, GameState } from '../model.ts';
import type { GamePresentationBroker } from '../presentation.ts';
import { MockAdAdapter } from './mock-adapter.ts';
import { registerGamePlacements } from '../placements.ts';
import { conciseEvents, mvpStatus } from './view-model.ts';

const LEGACY_KEY = 'odesos.dev.ads.v1';
export interface DevTools { service: AdService; attachFrame(frame: HTMLIFrameElement | null): void; destroy(): void }

export async function createDevTools(presentation: GamePresentationBroker): Promise<DevTools> {
  let stored: unknown; let migrated = false;
  try { const current = siteStorage.get(STORAGE_KEY); const legacy = current ? null : siteStorage.get(LEGACY_KEY); stored = JSON.parse(current ?? legacy ?? 'null'); migrated = Boolean(legacy); } catch { stored = null; }
  const loaded = loadDevSettings(stored); let needsChoice = loaded.needsChoice;
  const config = loaded.config; if (migrated) config.startup.enabled = false;
  const provider = new MockAdAdapter(() => service.config, () => { service.config.mock.nextResult = 'completed'; persist(); syncInputs(); }, presentation);
  const service = new AdService(provider, { development: true }); service.configure(config); await provider.initialize();
  registerGamePlacements(service);
  presentation.setObserver((event, request, result, reason) => { if(event === 'courtesy-started') service.state = 'courtesy'; service.emit(event, request, result, reason); });

  const help = new ContextHelp(document);
  const panel = document.createElement('aside'); panel.className = 'odesos-ad-dev'; panel.hidden = true; panel.setAttribute('role', 'complementary'); panel.setAttribute('aria-labelledby', 'odesos-ad-dev-title');
  const header = document.createElement('header'); const title = document.createElement('h2'); title.id = 'odesos-ad-dev-title'; title.textContent = 'ODESOS AD DEV';
  const close = document.createElement('button'); close.textContent = 'Close'; close.type = 'button'; close.setAttribute('aria-label', 'Close Odesos Ad Dev'); header.append(title, close);
  const notice = document.createElement('p'); notice.textContent = 'Mock tooling · Non-modal · This browser session · PROVIDER COMPLIANCE NOT YET REVIEWED';
  const feedback = document.createElement('p'); feedback.className = 'ad-dev-feedback'; feedback.setAttribute('role', 'status'); feedback.textContent = 'Fullscreen mock presentation requires a connected game Ad Player.';
  const content = document.createElement('div'); content.className = 'ad-dev-scroll'; panel.append(header, notice, feedback, content);
  const trigger = document.createElement('button'); trigger.className = 'odesos-ad-dev-trigger'; trigger.type = 'button'; trigger.textContent = 'AD DEV'; trigger.setAttribute('aria-label', 'Open website Ad Dev Panel'); trigger.setAttribute('aria-expanded', 'false'); const triggerHost=document.createElement('div');triggerHost.className='ad-dev-launcher';triggerHost.append(trigger);document.body.append(triggerHost,panel);help.attach(trigger,'Open website Ad Dev Panel','Opens the non-modal website inspector. Uncovered page/game areas remain interactive; no game resize or ad request.',triggerHost);
  let previousFocus: HTMLElement | null = null;
  const setOpen = (open: boolean) => { help.hide(); panel.hidden = !open; trigger.setAttribute('aria-expanded', String(open)); if (open) { previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : trigger; close.focus(); refresh(); } else if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true }); };
  const toggle = () => setOpen(panel.hidden === true); trigger.addEventListener('click', toggle); close.addEventListener('click', () => setOpen(false));
  const key = (event: KeyboardEvent) => { if(help.dismissEscape(event)) return; if (event.key === 'Escape' && !panel.hidden) { event.preventDefault(); event.stopImmediatePropagation(); setOpen(false); return; } if (event.ctrlKey && event.shiftKey && event.code === 'KeyA') { event.preventDefault(); event.stopPropagation(); toggle(); } };
  window.addEventListener('keydown', key, true); const childKey=(event:KeyboardEvent)=>{if(event.ctrlKey && event.shiftKey && event.code==='KeyA') key(event);}; let childWindow: Window | null = null;
  function attachFrame(frame: HTMLIFrameElement | null): void { try { childWindow?.removeEventListener('keydown', childKey, true); childWindow = frame?.contentWindow ?? null; childWindow?.addEventListener('keydown', childKey, true); } catch { childWindow = null; } }

  const fields = new Map<string, HTMLInputElement | HTMLSelectElement>(); const previewButtons: HTMLButtonElement[] = [];
  const mvp = document.createElement('div'); mvp.className='ad-dev-mvp';mvp.dataset.testid='ad-dev-mvp';content.append(mvp);
  const advanced=document.createElement('details');advanced.className='ad-dev-advanced';advanced.dataset.testid='ad-dev-advanced';
  const advancedTitle=document.createElement('summary');advancedTitle.textContent='ADVANCED QA';advanced.append(advancedTitle);content.append(advanced);
  advanced.addEventListener('toggle',()=>help.hide());
  function section(name: string): HTMLElement { const details = document.createElement('details'); details.open = true; const summary = document.createElement('summary'); summary.textContent = name; details.append(summary); advanced.append(details); return details; }
  function paragraph(parent: HTMLElement, text: string): void { const p = document.createElement('p'); p.textContent = text; parent.append(p); }
  function output(parent: HTMLElement, kind: string): HTMLPreElement { const row=document.createElement('div');row.className='ad-help-row';const element = document.createElement('pre');row.append(element);parent.append(row);help.attach(element, `${kind} readout`, READOUT_HELP[kind] ?? READOUT_HELP.stats,row); return element; }
  function action(parent: HTMLElement, label: string, run: () => void | Promise<void>, description?: string): HTMLButtonElement { const button = document.createElement('button'); button.type = 'button'; button.textContent = label; button.addEventListener('click', () => { void Promise.resolve().then(run).catch(() => { feedback.textContent = 'Test cancelled or unavailable. No gameplay reward was granted.'; }); }); const row=document.createElement('div');row.className='ad-help-row';row.append(button);parent.append(row);help.attach(button,label,description ?? actionHelp(label),row);return button; }
  function configValue(path: string): unknown { return path.split('.').reduce<unknown>((value, key) => (value as Record<string, unknown>)[key], service.config); }
  function change(path: string, value: unknown): void { const copy = structuredClone(service.config) as unknown as Record<string, unknown>; const parts = path.split('.'); let object = copy; for (const part of parts.slice(0, -1)) object = object[part] as Record<string, unknown>; object[parts.at(-1)!] = value; service.configure(copy); persist(); syncInputs(); if (path === 'banner.enabled') service.setBanner(Boolean(value)); refresh(); }
  function field(parent: HTMLElement, path: string, label: string, options?: [string, string][]): void { const wrapper = document.createElement('label'); wrapper.className = 'ad-dev-field'; const span = document.createElement('span'); span.textContent = label; wrapper.append(span); let control: HTMLInputElement | HTMLSelectElement; if (options) { const select = document.createElement('select'); for (const [value, text] of options) { const option = document.createElement('option'); option.value = value; option.textContent = text; select.append(option); } control = select; } else { const input = document.createElement('input'); input.type = typeof configValue(path) === 'boolean' ? 'checkbox' : 'number'; if (input.type === 'number') { const [section,key]=path.split('.'); const [min,max]=configBounds(section,key);input.min=String(min);input.max=String(max);input.step = '1'; } control = input; } control.addEventListener('change', () => change(path, control instanceof HTMLInputElement ? control.type === 'checkbox' ? control.checked : Number(control.value) : control.value)); control.dataset.testid='ad-config-'+path.replaceAll('.','-'); fields.set(path, control); wrapper.append(control); const row=document.createElement('div');row.className='ad-help-row';row.append(wrapper);parent.append(row);help.attach(control,label,fieldHelp(path),row); }
  function persist(): void { siteStorage.set(STORAGE_KEY, JSON.stringify(needsChoice ? { ...service.config, interstitial: { ...service.config.interstitial, sessionLimitEnabled: undefined } } : service.config)); }
  function syncInputs(): void { for (const [path, control] of fields) { if(document.activeElement===control) continue; const value = configValue(path); if (control instanceof HTMLInputElement && control.type === 'checkbox') control.checked = Boolean(value); else control.value = String(value); if(path==='interstitial.maxPerSession') control.disabled=!service.config.interstitial.sessionLimitEnabled; } }
  function approvedEvents(): string[] { return [...new Set([...service.placements.values()].filter(p=>p.gameId===service.gameId && !p.id.startsWith('dev-')).flatMap(p=>p.safeEvents??[]))]; }
  function ensurePlacements(): void { if (!service.gameId) return; for (const adType of ['startup', 'interstitial', 'rewarded'] as const) { const id = `dev-${service.gameId}-${adType}`; if (!service.placements.has(id)) service.register(devPlacement(service.gameId,adType,approvedEvents())); } }
  async function testAd(adType: FullscreenType, safeEvent?: string, force = false): Promise<void> { if (!service.gameId) { feedback.textContent = 'Open a public game page first.'; return; } ensurePlacements(); const request: AdRequest = { requestId: crypto.randomUUID(), gameId: service.gameId, placementId: `dev-${service.gameId}-${adType}`, adType, userInitiated: adType === 'rewarded', safeEvent }; if (safeEvent) service.emit('safe-event', request, undefined, safeEvent); const result = await service.request(request, force); feedback.textContent = `${adType}: ${result.result}${result.reason ? ` (${result.reason})` : ''}. Reward qualified: ${result.rewardQualified ? 'YES' : 'NO'}. No game reward applied.`; refresh(); }

  help.attach(close,'Close Odesos Ad Dev','Closes only this inspector. Does not cancel an ad or change game state.',header);
  help.attach(feedback,'Action feedback','Result of the most recent DEV action, including busy/blocked reasons. Generic tests never apply game rewards.',panel);
  const migration=document.createElement('section');migration.hidden=!needsChoice;advanced.append(migration);
  paragraph(migration,'New default: unlimited interstitials per session.');
  action(migration,'Use new default',()=>{needsChoice=false;service.configure({...service.config,interstitial:{...service.config.interstitial,sessionLimitEnabled:false}});migration.hidden=true;persist();syncInputs();refresh();});
  action(migration,'Keep my existing limit',()=>{needsChoice=false;migration.hidden=true;persist();refresh();});
  const summarySection=section('STATUS SUMMARY');
  const summaries=new Map<FullscreenType | 'banner',HTMLPreElement>();
  for(const type of ['startup','interstitial','rewarded','banner'] as const){const heading=document.createElement('h3');heading.textContent=type.toUpperCase();summarySection.append(heading);summaries.set(type,output(summarySection,type==='banner'?'banner':'summary'));}
  function refreshSummary():void {for(const [type,element] of summaries){const status=service.describe(type,presentation.rendererReady);element.textContent=Object.entries(status).map(([name,value])=>name+': '+String(value)).join('\n');}}
  function runShortcut(action:'eligible'|'timer'|'cooldown'):void {if(service.busy){feedback.textContent='another-ad-active: shortcut ignored.';return;}service.devAction(action);feedback.textContent='Timing shortcut applied. No ad displayed; other rules remain.';refresh();}
  function placementHelp(key:string,ceiling?:number):string {
    const descriptions:Record<string,string>={enabled:'ON permits this placement subject to all shared rules; OFF blocks it.',sessionLimitEnabled:'ON enforces the numeric placement cap; OFF means Unlimited for this interstitial only. Global limits/cooldowns remain.',cooldownSeconds:'Elapsed seconds between shown ads at this placement. Higher spaces requests farther apart; lower permits sooner. Range 0–86400.',maxPerSession:'Maximum actual shown ads at this placement when its limit is enabled. Higher allows more; lower allows fewer. Range 0–100; zero blocks. Ignored when Unlimited.',maxPerRun:'Maximum shown attempts for the same run. Higher allows more up to engineering ceiling '+ceiling+'; lower allows fewer, zero blocks. A shown skipped reward consumes the attempt. New run identity starts new allowance.'};
    return descriptions[key]+' Session-only; reload restores registry defaults. Changes apply when no ad is active and retain shown history. Clear Stats does not reset limits.';
  }
  const overview = section('OVERVIEW'); field(overview, 'master', 'Ads master'); const overviewOutput = output(overview, 'overview');
  const placements = section('PLACEMENTS');
  paragraph(placements, 'Session-only tuning. Safe events and engineering run-cap ceilings are read-only. Changes apply when no ad is active.');
  const placementRows = new Map<string, { controls: HTMLInputElement[]; stats: HTMLPreElement }>();
  function refreshPlacements(): void {
    for (const placement of service.placements.values()) {
      if (placement.gameId !== service.gameId) continue;
      let row = placementRows.get(placement.id);
      if (!row) {
        const block = document.createElement('fieldset');
        const legend = document.createElement('legend'); legend.textContent = placement.id; block.append(legend);
        paragraph(block, `${placement.adType} · Safe events: ${placement.safeEvents?.join(', ') || 'none'}`);
        const controls: HTMLInputElement[] = [];
        for (const key of ['enabled', 'sessionLimitEnabled', 'cooldownSeconds', 'maxPerSession', 'maxPerRun'] as const) {
          if (key === 'maxPerRun' && placement.maxPerRun === undefined) continue;
          if(key === 'sessionLimitEnabled' && placement.adType !== 'interstitial') continue;
          const label = document.createElement('label'); label.className = 'ad-dev-field'; label.textContent = key;
          const input = document.createElement('input'); input.dataset.placement = placement.id; input.dataset.field = key;
          input.type = (key === 'enabled' || key === 'sessionLimitEnabled') ? 'checkbox' : 'number'; input.min = '0'; input.step = '1';
          if (key === 'maxPerRun') input.max = String(placement.maxPerRun);
          input.addEventListener('change', () => { service.tunePlacement(placement.id, { [key]: (key === 'enabled' || key === 'sessionLimitEnabled') ? input.checked : Number(input.value) }); refresh(); });
          label.append(input); const row=document.createElement('div');row.className='ad-help-row';row.append(label);block.append(row);help.attach(input,`${placement.id} ${key}`, placementHelp(key, placement.maxPerRun),row);controls.push(input);
        }
        row = { controls, stats: output(block, 'stats') }; placementRows.set(placement.id, row); placements.append(block);
      }
      for (const input of row.controls) {
        input.disabled = service.busy || (input.dataset.field === 'maxPerSession' && placement.sessionLimitEnabled === false);
        if (document.activeElement === input) continue;
        const value = placement[input.dataset.field as 'enabled' | 'sessionLimitEnabled' | 'cooldownSeconds' | 'maxPerSession' | 'maxPerRun'];
        if (input.type === 'checkbox') input.checked = Boolean(value); else input.value = String(value);
      }
      row.stats.textContent = JSON.stringify(service.placementStats.get(placement.id) ?? { requests: 0, shown: 0 }, null, 2);
    }
    for (const [id, row] of placementRows) row.stats.parentElement!.hidden = service.placements.get(id)?.gameId !== service.gameId;
  }
  const startup = section('STARTUP'); field(startup, 'startup.enabled', 'Enabled (default OFF)'); field(startup, 'startup.oncePerSession', 'Once per session'); field(startup, 'startup.courtesy', 'Courtesy enabled'); const startupOutput = output(startup, 'startup'); action(startup, 'TEST STARTUP', () => testAd('startup')); action(startup, 'RESET STARTUP', () => { service.devAction('startup'); refresh(); });
  const interstitial = section('INTERSTITIAL'); field(interstitial,'interstitial.sessionLimitEnabled','Limit interstitials per session'); field(interstitial, 'interstitial.enabled', 'Enabled'); field(interstitial, 'interstitial.firstSeconds', 'First eligible after active seconds'); field(interstitial, 'interstitial.intervalSeconds', 'Eligibility interval seconds'); field(interstitial, 'interstitial.cooldownSeconds', 'Cooldown seconds'); field(interstitial, 'interstitial.maxPerSession', 'Maximum per session'); field(interstitial, 'interstitial.resetAfterRewarded', 'Reset cooldown after rewarded'); paragraph(interstitial, 'Time creates eligibility only. A registered safe semantic event is still required.'); const interstitialOutput = output(interstitial, 'interstitial'); action(interstitial, 'Satisfy playtime requirement', () => { runShortcut('eligible'); }); action(interstitial, 'Restart playtime wait', () => { runShortcut('timer'); }); action(interstitial, 'Clear interstitial cooldown', () => { runShortcut('cooldown'); }); const safeLabel=document.createElement('label');safeLabel.textContent='Approved safe event';const safeSelect=document.createElement('select');safeSelect.setAttribute('aria-label','Approved safe event');safeLabel.append(safeSelect);interstitial.append(safeLabel);help.attach(safeSelect,'Approved safe event','Read-only allowlist from real placements for the current game. Choose a semantic event to simulate via a DEV preview; this does not press PLAY or restart a game.',interstitial); action(interstitial, 'Test safe transition', () => testAd('interstitial', safeSelect.value)); action(interstitial, 'Force mock interstitial — bypass policy', () => testAd('interstitial', undefined, true));
  const rewarded = section('REWARDED'); field(rewarded, 'rewarded.enabled', 'Rewarded master'); field(rewarded, 'rewarded.cooldownSeconds', 'Global rewarded cooldown seconds'); field(rewarded, 'rewarded.maxPerSession', 'Maximum per session'); field(rewarded, 'rewarded.courtesy', 'Courtesy enabled'); paragraph(rewarded, 'Only completed qualifies. The game owns inventories and run identities; the host enforces registered shown-attempt ceilings. Generic tests grant no game reward.'); const rewardedOutput = output(rewarded, 'rewarded'); action(rewarded, 'TEST REWARDED GENERIC', () => testAd('rewarded'));
  const banner = section('BANNER'); field(banner, 'banner.enabled', 'game-page-primary enabled'); const bannerOutput = output(banner, 'banner'); action(banner, 'SHOW MOCK BANNER', () => change('banner.enabled', true)); action(banner, 'HIDE MOCK BANNER', () => change('banner.enabled', false));
  const courtesy = section('COURTESY'); field(courtesy, 'courtesy.enabled', 'Master enabled'); field(courtesy, 'courtesy.durationMs', 'Duration ms (400–2500)'); for (const type of ['startup', 'interstitial', 'rewarded']) field(courtesy, `courtesy.${type}`, `${type} courtesy`); field(courtesy, 'courtesy.mascot', 'Mascot'); field(courtesy, 'courtesy.animation', 'Animation (game must respect reduced motion)'); field(courtesy, 'courtesy.preset', 'Message preset', [['friendly', 'Friendly'], ['concise', 'Concise']]); paragraph(courtesy, 'Previews are available only through a connected game Ad Player; the website never renders fullscreen previews.'); for (const type of ['startup', 'interstitial', 'rewarded'] as const) previewButtons.push(action(courtesy, `PREVIEW ${type.toUpperCase()}`, () => testAd(type, type === 'interstitial' ? safeSelect.value : undefined, type === 'interstitial')));
  const simulation = section('SIMULATION'); const stateLabel = document.createElement('label'); stateLabel.textContent = 'Simulated game state (does not control game)'; const stateSelect = document.createElement('select'); for (const name of ['unknown', 'menu', 'playing', 'paused', 'game-over']) { const option = document.createElement('option'); option.value = name; option.textContent = name; stateSelect.append(option); } stateLabel.append(stateSelect); simulation.append(stateLabel); stateSelect.addEventListener('change', () => service.setGameState(stateSelect.value as GameState)); field(simulation, 'mock.nextResult', 'Next result — one shot, then Complete', [['completed', 'Complete'], ['closed', 'External close — QA injected'], ['failed', 'Load error'], ['no_fill', 'No fill'], ['timeout', 'Timeout'], ['unavailable', 'Unavailable']]); field(simulation, 'mock.loadingMs', 'Mock loading delay ms (0–5000)'); field(simulation, 'mock.durationMs', 'Game mock duration ms (500–15000)'); field(simulation, 'mock.presentationTimeoutMs', 'Game presentation timeout ms (500–15000)');
  action(simulation,'Abort current mock — QA only',()=> { service.cancelActive('qa-abort'); feedback.textContent='QA cancellation requested; no reward. Shown history is retained.'; });
  help.attach(stateSelect,'Simulated game state','Changes only the website reported state for clock testing, not the actual game. Playing advances active time only while visible and no ad is active. Session-only; real bridge transitions can replace it.',simulation);
  const events = section('EVENTS'); (events as HTMLDetailsElement).open=false; const statsOutput = output(events, 'stats'); const logOutput = output(events, 'events'); action(events, 'CLEAR SESSION STATS', () => { service.clearStats(); refresh(); }); paragraph(events, 'Clears observations only. Safety state and reward receipts remain.'); action(events, 'RESET DEFAULTS', () => { needsChoice=false;migration.hidden=true;service.configure(DEFAULT_CONFIG); persist(); syncInputs(); refresh(); });

  function mvpSection(title:string): HTMLElement {
    const section=document.createElement('section');section.className='ad-mvp-section';
    const heading=document.createElement('h3');heading.textContent=title;section.append(heading);mvp.append(section);return section;
  }
  const compactStatus=mvpSection('STATUS');const statusList=document.createElement('dl');statusList.className='ad-mvp-status';compactStatus.append(statusList);
  const statusFields=new Map<string,HTMLElement>();
  for(const key of Object.keys(mvpStatus(service,presentation.rendererReady))){const dt=document.createElement('dt');dt.textContent=key;const dd=document.createElement('dd');statusFields.set(key,dd);statusList.append(dt,dd);}
  help.attach(statusList,'Ad system status','Current readiness and policy are separate from the last request. Make Eligible changes timing only; inspect the block reason and Clear Cooldown separately. A real PLAY/RESTART or approved test safe event is still required.',compactStatus);
  const switches=mvpSection('AD TYPES');
  function moveField(path:string,parent:HTMLElement,label:string) {
    const input=fields.get(path)!;const row=input.closest<HTMLElement>('.ad-help-row')!;
    row.querySelector('label > span')!.textContent=label;input.setAttribute('aria-label',label);parent.append(row);
    // Keep hover/focus content; omit repeated visual help buttons in the MVP.
    row.querySelector<HTMLElement>('.ad-help-anchor')!.hidden=true;
  }
  for(const [path,label] of [['master','Ads Enabled'],['startup.enabled','Startup'],['interstitial.enabled','Interstitial'],['rewarded.enabled','Rewarded'],['banner.enabled','Banner']])moveField(path,switches,label);
  const policy=mvpSection('INTERSTITIAL POLICY');
  moveField('interstitial.firstSeconds',policy,'First eligible after (seconds)');moveField('interstitial.cooldownSeconds',policy,'Cooldown (seconds)');
  const unlimitedRow=document.createElement('label');unlimitedRow.className='ad-dev-field';const unlimited=document.createElement('input');unlimited.type='checkbox';unlimited.dataset.testid='ad-session-unlimited';unlimited.setAttribute('aria-label','Unlimited interstitials');unlimitedRow.append('Session limit: Unlimited',unlimited);policy.append(unlimitedRow);
  unlimited.addEventListener('change',()=>change('interstitial.sessionLimitEnabled',!unlimited.checked));
  // The existing limit-enable field is represented by its inverse, not duplicated.
  fields.get('interstitial.sessionLimitEnabled')!.closest('.ad-help-row')!.remove();fields.delete('interstitial.sessionLimitEnabled');
  moveField('interstitial.maxPerSession',policy,'Finite session limit');
  const limitNote=document.createElement('p');limitNote.className='ad-mvp-note';policy.append(limitNote);
  const tests=mvpSection('TEST ADS');
  function compactAction(parent:HTMLElement,label:string,run:()=>void|Promise<void>,description:string) {
    const button=action(parent,label,run,description);button.dataset.testid='ad-'+label.toLowerCase().replace(/[^a-z0-9]+/g,'-');button.title=description;button.setAttribute('aria-description',description);button.closest('.ad-help-row')!.querySelector<HTMLElement>('.ad-help-anchor')!.hidden=true;return button;
  }
  function moveAction(from:HTMLElement,oldLabel:string,label:string,parent:HTMLElement) {
    const button=[...from.querySelectorAll<HTMLButtonElement>('button')].find(b=>b.textContent===oldLabel)!;
    const row=button.closest<HTMLElement>('.ad-help-row')!;button.textContent=label;button.setAttribute('aria-label',label);button.dataset.testid='ad-'+label.toLowerCase().replace(/[^a-z0-9]+/g,'-');row.querySelector<HTMLElement>('.ad-help-anchor')!.hidden=true;parent.append(row);return button;
  }
  previewButtons.push(moveAction(startup,'TEST STARTUP','Test Startup',tests));
  previewButtons.push(compactAction(tests,'Test Interstitial',()=>testAd('interstitial',safeSelect.value || approvedEvents()[0]),'Normal policy and an approved safe event. Generic preview does not start/restart a game.'));
  previewButtons.push(moveAction(rewarded,'TEST REWARDED GENERIC','Test Rewarded',tests));
  const bannerToggle=compactAction(tests,'Show Banner',()=>change('banner.enabled',!service.config.banner.enabled),'Website banner only; no fullscreen request.');
  for(const oldLabel of ['SHOW MOCK BANNER','HIDE MOCK BANNER'])[...banner.querySelectorAll<HTMLButtonElement>('button')].find(b=>b.textContent===oldLabel)?.closest('.ad-help-row')?.remove();
  moveAction(interstitial,'Satisfy playtime requirement','Make Interstitial Eligible',tests);moveAction(interstitial,'Clear interstitial cooldown','Clear Cooldown',tests);
  const outcomes=mvpSection('NEXT MOCK OUTCOME');const outcomeButtons=new Map<string,HTMLButtonElement>();
  for(const [value,label] of [['completed','Complete'],['closed','Skip / no reward'],['no_fill','No Fill'],['timeout','Timeout'],['failed','Error']])outcomeButtons.set(value,compactAction(outcomes,label,()=>{if(service.busy){feedback.textContent='Outcome applies to a next request only; wait for the active request.';return;}change('mock.nextResult',value);},'One-shot simulation. Complete is restored after provider preparation. Actual startup/interstitial are not player-skippable.'));
  const abortButton=moveAction(simulation,'Abort current mock — QA only','Abort QA presentation',outcomes);abortButton.title='QA cancellation only; no reward. Shown attempts and cooldown history remain.';
  const rewardStatus=mvpSection('REWARDED STATUS');const rewardReadout=document.createElement('p');rewardReadout.dataset.testid='ad-reward-status';rewardStatus.append(rewardReadout);
  const recent=mvpSection('RECENT EVENTS');const recentList=document.createElement('ol');recentList.className='ad-mvp-events';recentList.dataset.testid='ad-recent-events';recent.append(recentList);
  compactAction(recent,'Clear Stats',()=>{service.clearStats();refresh();},'Clears observations only; identical scope to Clear Session Stats. Safety limits, cooldowns, receipts and game saves remain.');
  compactAction(recent,'View Full Log',()=>{advanced.open=true;(events as HTMLDetailsElement).open=true;events.querySelector('summary')?.focus();},'Opens Advanced QA event history and payloads.');
  const bottom=mvpSection('RESET / OBSERVATIONS');moveAction(events,'RESET DEFAULTS','Reset Defaults',bottom);moveAction(events,'CLEAR SESSION STATS','Clear Session Stats',bottom);
  const resetNote=document.createElement('p');resetNote.className='ad-mvp-note';resetNote.textContent='Reset Defaults changes ad configuration only; game saves remain. Clear Session Stats clears observations only; cooldowns, caps, run attempts and reward receipts remain.';bottom.append(resetNote);
  function refreshMvp() {
    for(const [key,value] of Object.entries(mvpStatus(service,presentation.rendererReady)))statusFields.get(key)!.textContent=value;
    if(document.activeElement!==unlimited)unlimited.checked=!service.config.interstitial.sessionLimitEnabled;
    limitNote.textContent=unlimited.checked?'Unlimited — the finite value is inactive. Cooldowns and placement rules still apply.':'Finite limit applies to actual shown interstitials; observations cannot replenish it.';
    bannerToggle.textContent=service.config.banner.enabled?'Hide Banner':'Show Banner';abortButton.disabled=!service.busy;
    for(const [value,button] of outcomeButtons){button.setAttribute('aria-pressed',String(value===service.config.mock.nextResult));button.disabled=service.busy;}
    recentList.replaceChildren(...conciseEvents(service.events).map(text=>{const li=document.createElement('li');li.textContent=text;return li;}));
    const request=service.lastRequest?.adType==='rewarded'?service.lastRequest:null;
    const placement=request?service.placements.get(request.placementId):null;
    const attempts=request?service.rewardAttempt(request.placementId,request.runId):{used:null,remaining:null};
    const last=service.lastResults.rewarded;
    rewardReadout.textContent=`Placement: ${placement?.id ?? 'Awaiting request'} · Available: ${service.describe('rewarded',presentation.rendererReady).Current} · Attempt used / remaining: ${attempts.used===null?'requires game run context':`${attempts.used} / ${attempts.remaining}`} · Last result: ${last?.result ?? 'none'} · Reward acknowledged: ${service.rewardAcknowledgments}`;
  }
  function refresh(): void { if (panel.hidden) return;refreshMvp(); refreshSummary(); syncInputs(); const approved=approvedEvents();if(safeSelect.dataset.events!==approved.join(',')){safeSelect.replaceChildren(...approved.map(event=>{const option=document.createElement('option');option.value=event;option.textContent=event;return option;}));safeSelect.dataset.events=approved.join(',');} const seconds = (value: number | null) => value === null ? 'never' : `${Math.floor(value)}s`; const renderer = presentation.rendererReady; overviewOutput.textContent = `Provider: ${service.provider.name}\nPresentation surface: GAME\nConnected renderer: ${renderer ? 'YES' : 'NO'}\nRenderer ready: ${renderer ? 'YES' : 'NO'}\nCurrent game: ${service.gameId ?? 'NONE'}\nGame state: ${service.gameState}\nDocument visible: ${service.visible ? 'YES' : 'NO'}\nSession: ${seconds(service.sessionSeconds)}\nActive gameplay: ${seconds(service.activeSeconds)}\nAd state: ${service.state}\nRequest active: ${service.busy ? 'YES' : 'NO'}\nLast type: ${service.lastRequest?.adType ?? 'none'}\nLast placement: ${service.lastRequest?.placementId ?? 'none'}\nSince fullscreen: ${seconds(service.secondsSince(service.lastFullscreen))}\nLast error: ${service.lastError ?? 'none'}`; for (const button of previewButtons) { button.disabled = !renderer; button.title = renderer ? '' : 'Game Ad Player not connected'; } startupOutput.textContent = Object.entries(service.startup).map(([key, value]) => `${key}: ${value ? 'YES' : 'NO'}`).join('\n'); const eligibility = service.interstitialEligibility(); interstitialOutput.textContent = `Eligible: ${eligibility.eligible ? 'YES' : 'NO'}\nReason: ${eligibility.reason}\nActive play: ${seconds(service.activeSeconds)}\nTime until threshold: ${seconds(eligibility.secondsRemaining)}\nSince interstitial: ${seconds(service.secondsSince(service.lastInterstitial))}\nCount/session: ${service.interstitialCount}\nSession cap: ${service.config.interstitial.sessionLimitEnabled ? service.config.interstitial.maxPerSession : 'Unlimited'}\nSafe events: ${[...new Set([...service.placements.values()].filter((p) => p.gameId === service.gameId).flatMap((p) => p.safeEvents ?? []))].join(', ') || 'none'}`; rewardedOutput.textContent = [...service.placements.values()].filter((p) => p.adType === 'rewarded').map((p) => `${p.id}\nGame: ${p.gameId} · enabled: ${p.enabled}\nCooldown: ${p.cooldownSeconds}s · session cap: ${p.sessionLimitEnabled === false ? 'Unlimited' : p.maxPerSession}\nRun cap: ${p.maxPerRun ?? 'not configured'} (validated runId when configured)`).join('\n\n') || 'No placements registered.'; const size = service.bannerHost?.getBoundingClientRect(); bannerOutput.textContent = `Visible: ${service.bannerVisible ? 'YES' : 'NO'}\nShown observations: ${service.stats.banner.shown}\nDimensions: ${Math.round(size?.width ?? 0)} × ${Math.round(size?.height ?? 0)}\nWebsite slot outside iframe`; statsOutput.textContent = `${JSON.stringify(service.stats, null, 2)}\nInterstitial eligibility events: ${service.eligibleEvents}\nBlocked reasons: ${JSON.stringify(service.blockedReasons)}\nReward acknowledgments: ${service.rewardAcknowledgments}`; logOutput.textContent = service.events.slice(-60).reverse().map(entry=>JSON.stringify(entry,null,2)).join('\n\n'); if (document.activeElement !== stateSelect) stateSelect.value = service.gameState; }
  const inspection=mountInspection(advanced,'website',()=>({gameId:service.gameId,phase:service.gameState,pendingTransition:service.busy,adSuspended:service.busy,rendererReady:presentation.rendererReady,request:service.lastRequest?{...service.lastRequest}:null,state:service.state,error:service.lastError,eligibility:service.interstitialEligibility(),counters:JSON.parse(JSON.stringify(service.stats)),limits:JSON.parse(JSON.stringify(service.config)),placements:[...service.placements.values()].map(value=>({...value}))}),()=>service.config,()=>!service.busy);
  const unsubscribe = service.subscribe((event) => { if (event.event === 'game-context') { help.hide();ensurePlacements(); } refreshPlacements(); refresh(); }); const interval = window.setInterval(() => { if(!panel.hidden){refreshPlacements(); refresh();} }, 500); syncInputs(); if (migrated && !needsChoice) persist();
  return { service, attachFrame, destroy() { inspection.destroy();clearInterval(interval); unsubscribe(); attachFrame(null); window.removeEventListener('keydown', key, true); help.destroy();panel.remove(); triggerHost.remove(); presentation.setObserver(() => {}); } };
}
