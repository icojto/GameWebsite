# Odesos Ads / Orbit Patch 03.1 QA

## Current Patch 03.1 procedure

Use a test browser profile and the full portal, not standalone Orbit. The historical records below preserve earlier evidence; their old three/session caps and player-close instructions are superseded here.

1. Open `/games/orbit-break/`, then AD DEV or Ctrl+Shift+A. Note the unchanged player rectangle and interactive uncovered page/game areas.
2. Fresh settings/RESET DEFAULTS show Unlimited. If old numeric settings exist, choose Use new default or Keep my existing limit; confirm other preferences survive. Placement tuning is session-only; global tuning persists.
3. Satisfy playtime requirement: nothing appears. Clear interstitial cooldown if needed, then actual PLAY/RESTART: eligible interstitial appears. Death alone must not show one. Repeat with finite global/placement caps; enabled zero blocks. Clear Stats must not release safety caps.
4. Startup ON in a fresh session: PLAY shows startup only, then begins. Startup/interstitial have no close/skip. Escape, outside clicks, Space and Enter must not skip or reach underlying gameplay. Countdown continues the pending transition.
5. On a fresh run choose revive after death. Skip — no reward grants nothing and consumes the shown attempt. Complete preserves the same run and awards once. QA abort, injected external close, failures and watchdog cancellation never reward and restore input/audio.
6. Read Current versus Last result through wait/eligibility/preparation/courtesy/show/result. Active wait differs from cooldown; banner has no completion count; generic rewarded preview has no game acknowledgment.
7. Hover/focus/tap help in every website section and Orbit DEV → Ads Integration. Try disabled controls. Escape first dismisses help without closing the panel/pausing/activating anything. Live counters must not interrupt typing or dismiss help.
8. Test desktop, 360px portrait and 640×360 landscape, keyboard focus and browser zoom. Reload confirms intended saved global settings, not session-only placement edits.
9. Build/preview production: no DEV/mock/help UI, no shortcut response, no mock banner or rewarded monetization controls; both games still play.

Executed: check; Ads **47**, Orbit ads **58**, Orbit **11**, portal **4**, Reactor **15** tests (**135 PASS**); build; production scan (32 artifacts); Pages routes/assets; diff whitespace. Pages initially hit sandbox localhost EACCES, then passed with local-network permission.

Browser observations: unchanged iframe rectangle, no overflow at desktop/360×800/640×360, help viewport bounds and Escape precedence, focused numeric edit retained, interstitial ignored Escape/Space/Enter and completed automatically, QA abort restored the game, generic rewarded skip returned no reward, Orbit help stayed local. Physical touch/audio, OS reduced motion, screen reader, zoom, long-session soak and full actual-trigger replays remain human QA (logic tests cover trigger/reward regressions). Existing source-less MutationObserver error remains unattributed; console-clean is NOT VERIFIED.

## Commands

```powershell
cd C:\Users\mlgjm\Desktop\GameWebsite
npm.cmd ci
npm.cmd run check
npm.cmd run test:ads
npm.cmd run test:portal
npm.cmd run test:orbit
npm.cmd run test:orbit-ads
npm.cmd run test:reactor
npm.cmd run build
npm.cmd run verify:ads-production
npm.cmd run verify:pages
npm.cmd run dev
```

## Historical Ads v1.1 boundary checks (before Orbit integration)

1. Open the printed `/games/orbit-break/` URL and note the player rectangle.
2. Press Ctrl+Shift+A. Confirm the inspector opens without a dark backdrop; accessibility semantics are complementary/non-modal.
3. While it remains open, click Home/Games/About/Contact where visible, website controls and the uncovered game iframe. Only the drawer's own rectangle should intercept input.
4. Confirm player/iframe dimensions do not change and the page gains no horizontal overflow. Tab between website/game/panel controls; focus must not be trapped. Escape closes the panel and restores sensible focus.
5. Reopen. Overview must say `Presentation surface: GAME`, current game, and `Connected renderer: NO` / `Renderer ready: NO` before Prompt 3.
6. Confirm fresh Startup Enabled is OFF. TEST STARTUP should report disabled. Turn it ON, RESET STARTUP, then TEST STARTUP: no website courtesy/ad overlay; expect `unavailable (game-presentation-unavailable)`.
7. MAKE ELIGIBLE alone: no ad. SIMULATE SAFE EVENT: no website overlay and renderer-unavailable result. Preserve 180/180/180/3 defaults.
8. TEST REWARDED GENERIC: no website overlay; unavailable, reward qualified NO. Load/no-fill/unavailable outcomes should finish before presentation. Once Orbit connects, completed may qualify only after its shown+completed lifecycle.
9. Courtesy preview buttons should be disabled with `Game Ad Player not connected`. Configuration remains editable for the future renderer.
10. SHOW/HIDE MOCK BANNER. Confirm the banner remains website-level below action bar, outside the iframe, with no overflow.
11. Resize to about 360px. Confirm the non-modal bottom sheet remains usable; no backdrop intentionally disables the remaining page.
12. Review events for renderer-connected/unavailable, presentation-requested/ready, courtesy-started, ad-visual-started, terminal state and timeout as applicable.
13. Reload: v1.1 tuning persists; session observations reset. A legacy v1 configuration migrates without corruption and startup is forced OFF once.

After Prompt 3 supplies a temporary/real Orbit GameAdPlayer, repeat complete/close/fail/timeout and verify all visuals stay inside the iframe, pause/audio contract, duplicate rejection, cancellation, cooldown and reward acknowledgment.

## Production

1. Run build and preview. Open `/`, both public game pages and direct reloads.
2. Confirm no AD DEV trigger/panel, mock banner, website fullscreen overlay, courtesy runtime or mock adapter.
3. Ctrl+Shift+A does nothing. Orbit and Reactor start and play normally.
4. Homepage/footer show only two playable games; hidden game routes stay non-public while sources/builds remain preserved.
5. Inspect console/network for new errors and third-party traffic.

Human-only: physical Android/iPhone touch/audio, OS reduced motion, fullscreen/background transitions, assistive technology and long-session soak. Desktop emulation is not physical-device proof. The prior source-less MutationObserver browser error still requires attribution; do not claim a clean console until independently resolved.

## Prompt 3 completed verification — 2026-10-05

Baseline: 70 tests (Ads40, Orbit11, portal4, Reactor15). Current: **124 passing tests**, including 54 new Orbit ad tests. `check`, production build/boundary scan (32 artifacts), Pages verification and whitespace checks pass. The Pages HTTP verifier needed normal local-network execution outside the restricted sandbox; no code workaround was added.

Gate A PASS: authenticated game/host handshake, explicit renderer readiness, real service/bridge/broker/client/presenter round trip, ordered courtesy/show/terminal, origin/source/schema/identity rejection, duplicate/stale rejection, cancellation/watchdogs, audio and input lifecycle wiring.

Gate B PASS: all starts route through one lock; startup OFF/ON/due precedence, all startup outcomes fail open without a second fullscreen; not-applicable startup fallback; PLAY and RESTART semantic events; host eligibility/cooldown/caps; timer-alone and death-alone never request an interstitial. Browser observed startup in iframe, eligible PLAY, resize 1366×768→360×640 mid-ad without restart, early-close-to-play, and `orbit.restart-interstitial` after second death.

Gate C PASS: eight-second default, pending freeze, explicit opt-in/current UUID, one shown attempt, all nonqualified result paths, grace, exactly-once reward/ack/finalization, preserved run data, cleared hazards/protection/delay. Browser completed a revive with identical before/after UUID, `consumed:true`, and last result `completed`; subsequent death had no revive CTA. Permanent profile tests cover positive and zero-score runs with one runs-quest increment and save. Escape during the ad did not open PAUSED.

Gate D PASS for implemented automated/desktop checks: generic host placement controls, Orbit diagnostics/ranges, Why Ads open/close, approved courtesy mascot, mock visual, production tree-shaking, Null play and Reactor production start. Production showed no AD DEV/Orbit DEV/Why Ads/revive CTA. Source and artifact scanning found no real ad SDK/provider endpoints. **Full browser network instrumentation was not available; do not treat this as an exhaustive traffic audit.**

### Desktop viewport observations

These are browser viewport overrides, not physical devices. Website vertical scrolling in landscape is allowed by the existing player contract; the iframe itself must not scroll. Inspected screenshots plus DOM dimensions showed no iframe horizontal or vertical overflow. Checked menu/HUD/new controls at all six sizes; not every state at every size.

| Browser viewport | Observed iframe / mode | Result |
| --- | --- | --- |
| 360×640 | 319×370, embedded; ad resized live | PASS; DEV trigger moved above menu to avoid Why Ads overlap |
| 640×360 | 599×319, embedded | PASS internal fit; host page scrolls vertically |
| 390×844 | 349×488, embedded | PASS |
| 844×390 | 803×359 embedded; 844×332 fullscreen | PASS DOM fit |
| 768×1024 | tablet embedded; 768×966 fullscreen | PASS |
| 1366×768 | desktop embedded; 1366×710 fullscreen | PASS |

Native fullscreen screenshots under viewport override were scaled into the desktop capture; DOM dimensions passed, but visual/native fullscreen behavior remains a human confirmation. Touch-target dimensions and pointer handlers were reviewed; **physical touch, audio listening, screen-reader behavior, OS reduced motion, background-tab transitions and long-session soak are NOT VERIFIED**. Reduced-motion CSS and animation-independent timer tests pass. The browser continues to report the prior source-less `MutationObserver.observe` TypeError in both DEV and production; no repository MutationObserver code was found, but provenance is unconfirmed, so **console-clean status is NOT VERIFIED**.

## Historical Prompt 3 human procedure (superseded by current steps above)

Use a test browser profile. Commands above run from this isolated checkout; do not switch or merge the original website checkout. In host Ad Dev click RESET DEFAULTS, then reload for fresh safety caps. Number inputs commit on Tab/blur. Open Orbit DEV with its button or Ctrl+Shift+D; host Ad Dev uses Ctrl+Shift+A and stays non-modal.

1. Verify fresh startup OFF, renderer YES, state menu, four `orbit.*` placements. PLAY, Space and canvas click/tap must each start; while playing they only reverse. Pause/resume/settings/quests/locker/scores remain functional. RESTART appears after death.
2. Open Why Ads from menu, Tab to its close control, press Escape, and reopen/close. It must not be available during play/pause/death or with Null. Copy clearly describes optional revive and mock-only status.
3. Keep host panel open and operate uncovered website/game controls. Verify no website backdrop, focus trap or player resize. Toggle the mock banner; it stays outside the iframe below the action bar.
4. Enable startup, RESET STARTUP and reload. PLAY must show courtesy then mock, then play. It must not show an interstitial too. Return to menu: startup is no longer due. Repeat in fresh sessions with Next result Close early, Load error, No fill, Timeout and Unavailable; play must always continue.
5. Reset defaults/reload, click MAKE ELIGIBLE while still in menu. Nothing shows until PLAY; then courtesy→interstitial→play. Close early and verify play still starts. Set first/interval/cooldown and caps independently: each must block its own condition. Global defaults remain 180/180/180/3.
6. Play, then Orbit DEV→Ads Integration→Force death. No automatic interstitial. The eight-second revive choice has AD badge, Restart and Main menu. Record Run ID. Let expiry finalize; a later restart must not record it again.
7. On a fresh run force death, opt into revive before expiry. While loading/courtesy/mock is active, the offer must not count down, gameplay/input/audio must be suspended, and Escape/Space/rapid clicking must not open pause or launch a second request. Tab stays in the ad surface.
8. Let the mock complete. Verify unchanged Run ID, score/time/difficulty, cleared hazards, 1.5-second shield, normal attack interval plus 1-second extra delay. Verify one reward-granted event. No finished-score or runs-quest increment occurred. Force a second death: no revive button; one permanent finalization.
9. Fresh run: close the rewarded mock early. No revive; attempt consumed and one permanent result. Fresh run: select each pre-show failure outcome, wait until offer is nearly expired, then opt in. No reward; at least three seconds remain afterward. Retry is still subject to website caps.
10. During the revive decision choose RESTART. Old run finalizes once; only `restart-requested` is emitted; eligible interstitial may show, never a death-triggered one. New run gets a new ID. Repeat with close/failure and with rewarded cooldown still active.
11. During a decision choose MAIN MENU, and separately end a paused run via confirmation. Verify one score/run entry each; cancelled menu confirmation preserves the run. Local reset-used cannot bypass the website's same-run cap.
12. Use host Courtesy PREVIEW STARTUP/INTERSTITIAL/REWARDED. Startup preview requires enabled/available startup; use a fresh page after its cap. Previews pause/resume the correct phase and never apply game rewards. Toggle courtesy master, type toggles, mascot, animation, friendly/concise preset and duration. OFF skips courtesy; OS reduced motion uses static visuals but still completes.
13. In PLACEMENTS edit enabled/cooldown/session cap and revive run cap. Safe events are read-only. A run cap cannot exceed its registered ceiling of one. Disabling/zero-capping revive hides its live CTA even though generic DEV rewarded preview exists. Clear stats must not reset safety caps.
14. Test every listed viewport in menu, death decision, Why Ads, courtesy and mock. Resize/rotate while an ad is active: no restarted countdown, duplicate terminal or lost run. Check 44px new controls, focus outline, no iframe scrolling. Test normal/native fullscreen on a physical desktop browser.
15. During courtesy/mock navigate Home or Reactor, reload the iframe/page, and background/return. No stale overlay, reward, listener, timer or input lock may survive disposal; the next game must function. Check audible mute/restoration with nondefault master/music/SFX/mute settings.
16. Run production build/preview. Orbit PLAY/Space/restart/pause must work with no ad wait, mock graphics, banner, DEV panel, Why Ads or revive. Reactor INITIALIZE REACTOR must still work. Confirm only two public games; hidden sources remain preserved. Inspect console and network, including the outstanding source-less browser error before claiming a clean console.

Automated coverage of requested cases 1–51 is in `tests/orbit-ads.test.mjs` plus the existing service tests; cases 52–55 combine Null tests, production scanner, source review and browser smoke (traffic-audit limit above). Cases 56–60 are the four unchanged regression suites and build/Pages checks. No real-provider compliance or revenue claim is made.

## Reactor v1 handoff
Run `npm.cmd run test:reactor-ads` in addition to all shared, Orbit, portal and Reactor regression suites. The detailed 20-step human checklist, tested commands, browser-tool limitations and PC2 instructions are in [the Reactor patch log](patches/2026-10-05-reactor-monetization-v1.md).
Automated checks include real host bridge -> mock adapter -> presentation broker -> Reactor client -> provider-independent renderer, separate refill run ceilings, start precedence, queued Pause, actual-use accounting and production exclusions. They are not rendered iframe, physical-device, screen-reader or console verification.

## QA closure 0.4.1 / Prompt 4B

Use the new [QA contract](qa-contract-0.4.1.md) and [dated targeted handoff](patches/2026-10-06-qa-closure-0.4.1.md). `qa:dev` prints an isolated session URL; `qa:preview` is actual production Null. Existing checklists remain historical/compound requirements, with no automatic reclassification. Config View is locally verified; saved download bytes and clipboard-specific assertions still require human verification. QA reset never clears host safety history. Restart/rebuild after changing checkout; older running servers do not acquire a new build identity automatically.
