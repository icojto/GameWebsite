import { DEFAULT_CONFIG, configBounds } from '../model.ts';
const fields: Record<string,string> = {
  master:'ON permits ad requests subject to every other rule. OFF cancels the current request without reward and hides banners. It does not erase history.',
  'startup.enabled':'ON allows startup to take priority on the next applicable menu PLAY. OFF uses the ordinary interstitial opportunity. One action never shows both.',
  'startup.oncePerSession':'ON allows one startup request per page session, including failed attempts. OFF allows later requests, still subject to placement caps.',
  'startup.courtesy':'ON permits the game courtesy before a prepared startup. OFF skips that courtesy, not the ad. Courtesy master must also be ON.',
  'interstitial.enabled':'ON permits reviewed PLAY/RESTART opportunities. OFF blocks normal interstitials. Force testing can bypass this type switch, never Ads master.',
  'interstitial.sessionLimitEnabled':'ON enforces the numeric global maximum using actual shown history. OFF means Unlimited total interstitials. Timing, safe events, cooldown and placement rules still apply. Toggling retains history.',
  'interstitial.maxPerSession':'Maximum shown interstitials across all placements when the global limit is ON. Higher allows more, lower allows fewer; zero blocks. Ignored when the limit is OFF.',
  'interstitial.firstSeconds':'Active gameplay required for the first opportunity. Higher delays it; lower reaches it sooner. Menu, pause, hidden-tab and ad time do not count. Before the first shown ad, changes adjust the untouched first threshold.',
  'interstitial.intervalSeconds':'Additional active gameplay required after a shown interstitial. Higher gives fewer opportunities; lower gives more. A reviewed PLAY/RESTART event is still needed. Applies when the next ad is shown.',
  'interstitial.cooldownSeconds':'Minimum elapsed time after a fullscreen ad before another normal interstitial. Higher spaces ads farther apart; lower allows them sooner. Separate from active-play wait and placement cooldown.',
  'interstitial.resetAfterRewarded':'ON restarts interstitial cooldown after a shown rewarded ad, even if skipped. OFF leaves that shared timer unchanged. Other limits remain.',
  'rewarded.enabled':'ON permits explicit rewarded requests. OFF prevents them. The game still decides whether a reward choice is meaningful; this does not grant revive.',
  'rewarded.cooldownSeconds':'Minimum elapsed seconds between shown rewarded ads. Higher spaces offers farther apart; lower permits earlier requests. Explicit opt-in and run/session limits remain.',
  'rewarded.maxPerSession':'Maximum shown rewarded ads per page session. Higher permits more; lower permits fewer. Zero blocks. Orbit also keeps one shown attempt per run.',
  'rewarded.courtesy':'ON permits courtesy before a prepared rewarded ad. OFF skips courtesy only. Completion is still required for reward qualification.',
  'banner.enabled':'ON displays the mock website banner when available. OFF hides it. The slot is below player actions, outside the iframe; no game reward is possible.',
  'courtesy.enabled':'ON enables game-owned courtesy where its type toggle permits. OFF skips all courtesy. Ads still prepare/show under normal rules.',
  'courtesy.durationMs':'Courtesy duration in milliseconds, after preparation. Higher pauses longer; lower is quicker. Applies to the next presentation; never to banners.',
  'courtesy.startup':'ON permits startup courtesy; OFF skips it. Master and startup courtesy toggles also apply.',
  'courtesy.interstitial':'ON permits interstitial courtesy; OFF skips it. Courtesy master still applies.',
  'courtesy.rewarded':'ON permits rewarded courtesy; OFF skips it. Master and rewarded courtesy toggles also apply.',
  'courtesy.mascot':'ON shows the approved chibi in game courtesy. OFF hides only the art. Countdown and policy stay unchanged.',
  'courtesy.animation':'ON permits subtle mascot motion unless reduced motion is requested. OFF uses static art. Timing is unchanged.',
  'courtesy.preset':'Choose friendly or concise courtesy text for the next game presentation. This is mock copy, not reviewed provider compliance wording.',
  'mock.nextResult':'One-shot simulated outcome, then Complete. External close is developer injected, not a player skip. Errors/no fill/timeout/unavailable fail before presentation.',
  'mock.loadingMs':'Simulated preparation delay in milliseconds. Higher slows loading; lower prepares sooner. It does not change gameplay timers or reward eligibility.',
  'mock.durationMs':'Mock countdown duration in milliseconds. Higher keeps the game suspended longer; lower completes sooner. Startup/interstitial cannot be player-skipped; rewarded can.',
  'mock.presentationTimeoutMs':'Watchdog allowance in milliseconds for renderer readiness, also added to the presentation budget. Higher tolerates slower rendering; lower fails open sooner. Never grants rewards on timeout.',
};
export function fieldHelp(path:string):string {
  if(!fields[path]) throw new Error(`Missing ad field help: ${path}`);
  const value=path.split('.').reduce<unknown>((v,k)=>(v as Record<string,unknown>)[k],DEFAULT_CONFIG);
  const [section,key]=path.split('.');
  const range=typeof value==='number' ? configBounds(section,key).join('–')+(key.endsWith('Ms')?' ms':key==='maxPerSession'?' ads':' seconds'):'';
  return `${fields[path]}\nDefault: ${String(value)}.${range ? ` Range: ${range}.` : ''}\nSaved in this browser's DEV settings. Changes affect subsequent checks/requests unless described otherwise; existing safety history remains.`;
}
export const ACTION_HELP:Record<string,string>={
  'Satisfy playtime requirement':'MAKE ELIGIBLE: sets the next threshold to current active-play time. No ad appears. Shared/placement cooldowns, enabled caps and an approved safe event still apply. Ignored while an ad is active.',
  'Restart playtime wait':'RESET ELIGIBILITY TIMER: next threshold = current active seconds + configured first-eligibility seconds. Does not erase playtime, restart Orbit, clear counts or reset cooldowns. No ad appears.',
  'Clear interstitial cooldown':'RESET COOLDOWN: removes only the shared interstitial timer. Does not satisfy playtime, remove placement cooldowns or limits, or display an ad.',
  'Test safe transition':'SIMULATE SAFE EVENT: uses the selected reviewed event through a DEV preview placement and normal policy. May display an in-game mock and affect safety history. Does not actually PLAY/restart/end a run or grant game rewards. Test actual game buttons separately.',
  'Force mock interstitial — bypass policy':'DEV ONLY — presentation test, not proof that normal triggers work. Bypasses interstitial timing, safe-event, type switch and global cap checks. Still respects master, context, placement restrictions, visibility, concurrency and provider/renderer availability. No game transition or reward.',
  'Abort current mock — QA only':'Developer cancellation of the current request/presentation. Restores suspended input/audio, never rewards, and retains any already-shown attempt/cooldown history. It is not a player Skip control.',
  'TEST STARTUP':'Requests a DEV startup through normal policy. Can show courtesy/mock and consume startup/session safety history. Restores the previous game phase; does not start a run or grant a reward.',
  'RESET STARTUP':'Clears global startup requested/shown/completed flags for testing. Does not clear placement caps, cooldowns, counts or game state. No ad appears.',
  'TEST REWARDED GENERIC':'Requests an explicitly identified DEV rewarded preview. Can show and affect safety history, but never grants a game revive or sends a game reward acknowledgment.',
  'SHOW MOCK BANNER':'Enables and shows the website mock slot. Persists banner enabled; no fullscreen ad or gameplay reward.',
  'HIDE MOCK BANNER':'Disables and hides the website slot. Persists banner disabled; historical shown observations remain.',
  'TEST BANNER':'Enables the website mock banner. Does not cover the iframe or change gameplay. Saves the enabled setting.',
  'CLEAR SESSION STATS':'Clears displayed observations, last results and event log. Does not reset cooldowns, session/run limits, startup usage or reward receipts.',
  'RESET DEFAULTS':'Restores saved global DEV defaults including Unlimited interstitials. Does not reset safety history, game saves or session-only placement tuning. Master/default banner settings take effect immediately.',
  'Use new default':'Chooses Unlimited for the migrated global interstitial cap only. Keeps timing, courtesy, mock preferences, recorded safety history and every game save. Saves this one-time decision.',
  'Keep my existing limit':'Retains your saved numeric global interstitial cap and explicitly enables it. Keeps all other settings/history and game saves. Saves this one-time decision.',
};
export function actionHelp(label:string):string {
  if(label.startsWith('PREVIEW ')) return 'Mock request/presentation flow, not a screenshot-only preview. Requires a renderer; can affect session observations and safety history. Interstitial preview uses the documented Force bypass. Startup/rewarded use normal policy. No game reward is applied.';
  const help=ACTION_HELP[label];if(!help)throw new Error(`Missing ad action help: ${label}`);return help;
}
export const READOUT_HELP:Record<string,string>={
  overview:'Provider and renderer connection are capabilities, not proof of prepared readiness. Game state comes from bridge or explicit DEV simulation. Active time counts only visible playing time with no ad active. Session time is elapsed page time. Request state/last error are local diagnostics.',
  startup:'Requested is the global once/session safety flag. Shown means a visual actually started. Completed is a terminal success. Disabled/used startup cannot be retried normally; resetting observations does not release it.',
  interstitial:'Eligibility means timing/policy permit an opportunity, not that an ad is loaded. Active-play wait excludes menu/pause/background/ad time. Cooldown is a separate elapsed clock. Shared count/caps use actual shown history and survive Clear Stats. Safe events are reviewed semantic transitions.',
  rewarded:'Placements belong to games. Enabled/cooldown/session/run limits are checked on requests; these hints do not promise a currently available revive button. One shown Orbit revive attempt consumes its run allowance, including skips.',
  banner:'Visible/hidden refers to the website slot outside the iframe. Shown is a local display observation, not a verified provider impression. Dimensions are current CSS pixels; hidden slots have zero size. Banners have no video-completion count.',
  stats:'This browser/page session only. Requests=count of attempts; accepted=policy accepted; prepared=provider ready; shown=visual started. Completed/closed/failed/no fill/timeout/unavailable/blocked are outcomes. Reward acknowledgments are actual game confirmations; generic previews never grant game rewards. Clear Stats preserves safety history.',
  events:'Newest local events first: timestamp, type, result, game/placement, reason, active-play and session seconds. COMPLETED is success; player-skip alone is SKIPPED; other closes are CLOSED/CANCELLED. Block reasons identify timing, global session cap, placement cap/cooldown, missing event, visibility, concurrency or availability. Only the last 200 events are retained.',
  summary:'Current describes this type now, separately from Last result. ELIGIBLE means policy allows an opportunity; READY means the active request finished preparation. COURTESY/SHOWING require an actual presentation lifecycle. Counts are observations since Clear Stats, while safety counts may be higher. SKIPPED requires confirmed player-skip metadata; CLOSED/CANCELLED covers other closes. Reward acknowledgments are actual game confirmations, never preview rewards.',
};
