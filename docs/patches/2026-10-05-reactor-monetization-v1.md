# Reactor Stack monetization v1 — MOCK ONLY

## Starting point and boundaries

Repository: icojto/GameWebsite. Feature checkout:
`C:\Users\mlgjm\Desktop\GameTests\GameWebsite-Reactor-Monetization-v1`.
Branch: `codex/reactor-monetization-v1`, from fetched main
`e74308bb6f413919823a3586645d78d25a7e6914` (PR #18 merge).

Verified main contains Reactor revamp/Dev Panel, Player V2/production-readiness,
Ads v1.1 boundary corrections (PR #16), Orbit integration (PR #17), and Patch 03.1
(PR #18). Code checks confirmed explicit Unlimited defaults, type-specific skip
rules, current-versus-last status summaries, ContextHelp and clarified test actions.
Only Orbit and Reactor are public; Games 003–005 remain hidden/preserved.
Original Desktop/GameWebsite checkout remained on
`codex/orbit-monetization-v1-qa-fixes` at 720ed59, with its unrelated
`package-lock.json` modification preserved. New worktree started clean.

Baseline: npm ci (network retry required), check, ads 47, Orbit 11,
Orbit ads 58, portal 4, Reactor 15 and production build passed.
No package dependency added. No automatic merge or deployment.

## Implementation and internal gates

- Gate A: exact Reactor identity/placements, strict parent/source/origin/schema
  validation, reload handshake, mounted-view readiness, live DEV iframe route,
  copied approved mascot/badge and corrected provider-independent presentation.
  Bounded adaptation of Orbit client/protocol/GameAdPlayer/view avoids a risky
  cross-game refactor and imports no Orbit scene, profile or revive rules.
- Gate B: one locked public Start path; selected startup always ends that action's
  fullscreen opportunity. Explicit disabled/once-per-session/placement-cap
  startup eligibility rejection alone may fall through. Pause immediately blocks
  new gestures, lets one committed turn finish, then stays paused after any
  terminal ad outcome. A terminal turn cancels queued Pause. Internal suspension,
  Resume, normal powers, scores, cells and merges request no ads.
- Gate C: distinct Cool and Upgrade shown-attempt flags share one opaque run ID.
  Depleted stable live inventory alone exposes a labelled AD refill. Qualified
  shown completion grants exactly +1 and acknowledges once without activation.
  Skips consume only that power's opportunity. Pre-show failures preserve it.
  Existing state holds inventory plus actual used/granted counters; no inferred
  negative usage after refills. Score finalization remains tied to actual results.
- Gate D: game diagnostics/help and host registry controls, RAM-only game tuning,
  session JSON/CSV counters, Null/standalone paths and production scanning.
  Browser visual gate is explicitly HUMAN QA PENDING (no browser available).

Placements, all enabled with zero placement cooldown:

| ID | Trigger | Placement limit |
| --- | --- | --- |
| reactor.startup | Eligible deliberate Start, global startup OFF by default | 1/session |
| reactor.start-interstitial | start-requested: Initialize, Reinitialize, Pause-menu Restart | Unlimited (finite toggle available) |
| reactor.pause-interstitial | pause-requested at stable deliberate Pause | Unlimited (finite toggle available) |
| reactor.cool-refill | Explicit depleted Cool refill | 1 shown/run; 10/session |
| reactor.upgrade-refill | Explicit depleted Upgrade refill | 1 shown/run; 10/session |

Shared defaults remain 180 seconds first/interval/cooldown, explicit Unlimited
interstitial session count, rewarded 10/session and cooldown 0. Host restrictions
always apply; preview and statistics reset cannot bypass safety history.
No ad appears simply because time passes. Generic previews grant no inventory.

Board, RNG, moves, heat/peak heat, stability, score, merge counts and run identity
are untouched by refill/presentation. Gesture cancellation preserves committed
selection/arming while dropping pointer-down state. DEV preview during resolution
waits for the turn boundary; host watchdog may fail it safely if tuning makes that
boundary too slow. Audio stops active cues and preserves mute/volume preferences.
Disposal invalidates late results, removes presentation and releases input/audio;
bfcache navigation reloads the disposed document for a fresh bridge. Active runs
remain intentionally non-persistent. Countdown uses monotonic elapsed time, never
resize events. Startup/interstitial have no player skip; rewarded says Skip — no reward.

Production uses the existing Null provider: ordinary six-cell 6×6 run, one free
charge each, no reward CTA or Why Ads, mock view, courtesy runtime, DEV help/panels
or third-party ad traffic. Standalone DEV has no approved parent and still plays.
Move/Merge/Random Spawn and all approved balance values are unchanged.

## Validation and limits

Measured final validation:

| Command | Result |
| --- | --- |
| npm.cmd run check | PASS, portal and all game TypeScript |
| npm.cmd run test:ads | 47/47 |
| npm.cmd run test:orbit | 11/11 |
| npm.cmd run test:orbit-ads | 58/58 |
| npm.cmd run test:portal | 4/4 |
| npm.cmd run test:reactor | 15/15 |
| npm.cmd run test:reactor-ads | 66/66 |
| npm.cmd run build | PASS |
| npm.cmd run verify:ads-production | PASS, 32 artifacts, Null present |
| npm.cmd run verify:pages | PASS (local HTTP requires unsandboxed execution) |
| git diff --check | PASS |

Total automated tests: 201, zero failures. Node reports its existing experimental
TypeScript transform warning. An intermediate Orbit registry-size assertion
failed after registration grew from four to nine; it now correctly checks the
four Orbit placements by game ID, with all 58 Orbit ad tests passing.

The full-site DEV server launched. HTTP 200 verified portal route, live Reactor
embed source, Reactor main/ad DEV modules and Orbit embed. Node integration tests
exercise the actual bridge/service/mock broker/client/player chain.
Browser inventory was empty; opening the in-app browser returned unavailable.
No interactive browser screenshots, actual iframe measurements, physical touch,
screen-reader results, rendered resize pass, or console-clean claim is made.
The previously reported unattributed console error has not been cleared by this work.
Existing Phaser large-chunk build warnings remain.

Measured production baseline → implementation (decimal kB):
Reactor JS 1395.80 → 1409.70 (final 1,409,700 bytes; gzip 369.08 kB),
CSS 10.39 → 10.52 (10,524 bytes);
portal JS 47.25 → 48.00. Orbit's emitted JS/CSS hashes unchanged. No dependency change.

## Human / PC2 QA

From this checkout root run `npm.cmd run dev -- --port 5185`, open
`http://127.0.0.1:5185/games/reactor-stack`.
On PC2 first inspect `git status` and `git worktree list`, then fetch origin.
If the branch is absent, create a separate clean worktree tracking
`origin/codex/reactor-monetization-v1`; otherwise inspect its existing checkout
and update with `git pull --ff-only` only when clean. Never reset/stash unrelated
work. Run `npm.cmd ci` and the full-site command in that checkout. PCs do not
update automatically. Use the final handoff/PR for exact feature HEAD.

1. Open Reactor from the full local website, not a built embed file.
2. Open website AD DEV and Reactor Ctrl+Shift+D; confirm connected mounted renderer.
3. Start with startup OFF, then enable startup/reset its host QA state and retry.
   Confirm startup priority and no second fullscreen ad on that action.
4. Satisfy playtime and clear cooldown in website tools; wait without clicking:
   no spontaneous ad.
5. Initialize, finish/reinitialize, and Pause-menu Restart: at most one eligible ad,
   then exactly six initial cells, moves/heat/stability zero, one charge each.
6. Make an interstitial eligible mid-run, deliberately press Pause in both layouts.
7. After completion, failure, cancellation or no-fill remain PAUSED; Resume shows no ad.
8. Pause during a merge (raise animation duration if needed); count one move,
   one spawn and one set of rewards. A terminal turn must cancel queued Pause.
9. Spend free Cool at positive heat; watch refill. Receive +1 without cooling,
   move/score/stability/spawn changes or automatic activation.
10. Use the refill; no further Cool rewarded opportunity in that run.
11. Independently repeat Upgrade: receipt does not arm or change a cell.
12. Test rewarded Skip, host-injected pre-show failure, timeout and delayed results.
    No automatic retries, stale grants or stuck input.
13. A shown skip spends only the selected power's attempt; the other stays available.
14. Inspect consumed versus granted counts, session JSON/CSV, and hover/focus/tap help.
    DEV depletion is not consumption; elapsed wall seconds include pauses/ads.
15. Open Why Ads on the main menu; test Close, Escape and focus restoration.
16. Test actual iframe rectangles 360×640, 640×360, 390×844, 844×390, tablet and
    desktop. Measure iframe dimensions, not just the browser viewport.
17. Rotate/resize during courtesy/countdown; test player fullscreen. Check readable
    labels/AD badges, no clipping/iframe scroll, stable countdown and pointer mapping.
18. Navigate Orbit ↔ Reactor with the website panel open; correct placement controls.
19. Inspect cleanup, sound preference restoration, repeated requests and console.
20. Build and run `npm.cmd run preview`; play both games under Null. No mock,
    reward CTA, courtesy, Why Ads or developer UI; no ad network traffic.

Human design/balance/responsive approval and real-provider compliance remain deferred.

## File inventory

- `games/reactor-stack/src/ads/{protocol,ReactorAdClient,ReactorAdFlow,GameAdPlayer,integration}.ts`: typed transport, game flow and suspension/presentation orchestration.
- `games/reactor-stack/src/ads/dev/{MockAdView,integration-dev}.ts` and `{presentation,integration}.css`: DEV-only view, Why Ads, diagnostics and help.
- `games/reactor-stack/src/assets/{ad-badge,odesos-chibi-mascot}.svg`: unchanged approved art.
- `games/reactor-stack/src/{main,rules,audio,dev-panel}.ts`, `style.css`: hooks, counters, audio lock, safe DEV operations/exports and label styling.
- `src/ads/{placements,bridge}.ts`, `src/ads/dev/{help,panel}.ts`: registration, additive BOOT state and shared help wording.
- `vite.config.mjs`: both live public-game DEV embeds.
- `tests/{reactor-ads,orbit-ads,ads}.test.mjs`: new integration coverage and registry-aware regressions.
- `package.json`, `.github/workflows/pages.yml`: test command and CI.
- Reactor README, ads blueprint/QA/controls reference and this patch: launch/ownership/QA handoff.
