# QA contract 0.4.1

This is the bounded Prompt 4A interface. The finalized 332-case workbook and historical evidence remain unchanged. A fixture creates prerequisites; a snapshot, build-ID match, or passing unit test does not pass a compound workbook row or a LIVE retest.

## Launch and identify

From the repository root with the existing Node/npm dependencies:

```powershell
npm.cmd run qa:dev
npm.cmd run qa:preview
npm.cmd run qa:doctor
# Explicit unused ports, without fallback:
npm.cmd run qa:dev -- --port 5191
npm.cmd run qa:preview -- --port 5192
```

DEV builds the existing game assets then serves the actual development graphs. Preview builds and serves the production artifact with Null; no mock renderer or QA controls are present. Original dev/build/preview commands remain available. Paths containing spaces are passed as process arguments. Loopback only; strict ports; no unknown process is stopped. Ctrl+C stops only the launcher's owned process tree. Startup build deadline is 120 seconds; HTTP/route readiness deadline is 20 seconds. Logs and per-instance JSON manifests are in ignored `outputs/qa-launch/`; `latest.json` includes the most recent success or failure. Doctor reads that local record and reports source mismatch/restart needs; it does not certify the browser.

Stages: 1 process/build, 2 shell HTTP, 3 portal plus both iframe entries/modules with matching identity and JavaScript content types. Stages 4 browser transport/identity and 5 mounted canvas/actual bridge/renderer require direct browser evidence. The launcher reports **BROWSER_NOT_VERIFIED**, never GAME_READY. Ordinary production Null has no mock renderer by design. Build/process, port conflict, HTTP, wrong module route/mixed identity, browser transport, game mount and bridge/renderer are separate failure layers. For browser transport retry once on a fresh tab, then retain NOT VERIFIED and continue independent tests.

`meta[name="odesos-build"]` contains schema/id/revision/dirty/mode only. One build stamps the same generated ID in portal and all five game documents. Local paths and QA profiles are excluded. Identity reflects serve/build startup; HMR does not restamp it. After source changes or commits, restart DEV or rebuild/restart preview; Doctor reports STALE_SOURCE. Metadata agreement is identity evidence, not independent byte verification.

## Isolated QA storage

Use the exact URL printed by qa:dev: `?qa=<launcher-session-UUID>`. QA requires **DEV plus the launcher's matching VITE_QA_SESSION plus the exact query value**. `?qa=1` alone does not activate it; no query can activate it in production. Namespace selection occurs at module initialization, before profile/preferences/migration reads. The same query is propagated to the iframe, ordinary in-app navigation and iframe reload; reloading the host retains it. Starting qa:dev again creates a separate empty session. Existing ordinary DEV remains ordinary storage; it is not disposable unless the browser profile is.

Keys are `odesos.qa.<session>.<logical-key>`: portal theme/likes and their legacy keys, persisted DEV ad configuration/legacy config, Orbit profile/legacy best/mute, and Reactor scores/legacy best. Failed QA storage operations use isolated memory, never ordinary keys. No data is copied from the real profile. No localStorage.clear() is used. Active-run persistence is unchanged.

Orbit explicit MUTE alone persists in validated version-1 `orbitBreak.audio.v1`; master/music/SFX tuning remains memory-only. Temporary ad suspension never writes mute. Scores reset removes scores/best only and retains mute/progression. Profile reset retains best and mute while resetting XP/Stars/quests/cosmetics/equipment. Reactor Clear Scores removes scores and legacy best; its second reset also clears the RAM completion log, not tuning/audio/board. Reset current QA namespace deletes all saved keys for this session across portal/ad settings/both games; reload to re-read defaults. It does not reset the active host's ad safety history or other sessions. This is explicit DEV opt-in, not authentication.

## Controls and confirmation

Use **Open Game DEV** in each QA iframe, or the existing Ctrl+Shift+D shortcut. Use the website's **AD DEV** or Ctrl+Shift+A separately. Panels overlay without resizing/remounting the player. Reactor's constrained panel leaves the public HUD/powers uncovered. DEV controls are absent from production.

Orbit and Reactor reset confirmations use owner-document HTML dialog. Cancel receives initial focus; Escape/close cancels; Tab stays inside; focus returns to the trigger. Only explicit confirmation mutates once. Duplicate operations are refused; disposal/context changes invalidate pending confirmation, and active ad/resolution states block mutation. Orbit pauses ordinary play without requesting an ad and restores it safely after cancellation. Public dialogs and the non-modal host ad inspector retain their existing ownership. Help interaction never invokes the attached action; passive hover/focus help cannot intercept pointer input.

Prefer roles/accessible names. Stable scoped selectors:

| Surface | Selectors |
| --- | --- |
| Public Reactor variants | `reactor-pause/cool/upgrade`, `reactor-portrait-pause/cool/upgrade` test IDs; hidden variants have zero layout and should be excluded |
| Reactor panel/fixtures | `reactor-open-dev`, `reactor-dev-fresh-run`, `reactor-dev-force-win`, `reactor-dev-force-fail`, `reactor-dev-resolving-move-setup`, `reactor-dev-powers-depleted` |
| Orbit | `orbit-open-dev`; `orbit-qa.fresh`, `orbit-qa.forceDeath`, `orbit-qa.questReady`, `orbit-qa.legacy`, `orbit-qa.corrupt` scoped to game iframe |
| Each inspector | scoped `qa-refresh`, `qa-view-snapshot`, `qa-download-snapshot`, `qa-view-config`, `qa-download-config`, `qa-json`, `qa-storage-scope`, `qa-reset-namespace` |
| Confirmation | owner-document `qa-confirmation`, `qa-cancel`, `qa-confirm` |

Reactor numeric fields apply valid live input without rebuilding the focused input; blur normalizes the displayed validated value. Structural/starting settings remain next-run. Existing repeated numeric rows must be scoped to their named section rather than selected globally.

## Read-only snapshots/config

QA inspection is inside the existing panels. Explicit Refresh/View samples authoritative state; there is no hidden snapshot poll, per-frame DOM rebuild or focus-stealing refresh. Download uses the same serializer/schema; each newly requested sample has a fresh diagnostic sequence/time. View config and Reactor's existing Copy config use the same serialization as Download config. Non-finite numbers serialize as null; CSV fields quote and double embedded quotes. Download/clipboard capabilities require independent browser evidence.

Common schemaVersion/sequence/sampledAt (ISO UTC), session/mode/build/game, phase/runId/pendingTransition/adSuspended/error. Reactor includes dimensions/copied board, raw heat/capacity, stability/target, moves/score, selection/arming, resolution/queued Pause, inventory and actual used/granted/shown-attempt counts, completion/log counts. Orbit includes signed direction ±1, radians, elapsed milliseconds, score/tier/difficulty/projectiles, revive state, user mute and effective suspension. Website includes actual game/renderer, last request/state/error, eligibility reasons/waits, observations and configured policy limits/placements. Serialization never advances RNG, grants rewards or resets clocks. Visible Orbit statuses retain their existing modest 400ms refresh; histories are bounded and listeners/timers dispose.

## Named fixture catalog

| ID / label | Prerequisite and state | Expected phase / reset |
| --- | --- | --- |
| reactor-fresh / Fresh Run | Safe idle; normal configured initialization, new run UUID, starting inventories/counters; defaults 6×6/six occupied/legal action | PLAYING; new explicit fixture/run resets it; no ad request |
| reactor-near-win / Near Victory | New run; two Tier IV neighbors and stability one Tier V merge below target | PLAYING; actual 0→1 merge uses normal thresholds/animation |
| reactor-near-fail / Near Heat Failure | New run; Tier I at 0, heat one base move below maximum | PLAYING; actual 0→1 empty-neighbor move reaches normal heat threshold |
| reactor-resolving / Resolving Move Setup | New run; known Tier I at 0, others empty | PLAYING; actual 0→1 input enters RESOLVING and completes its callbacks; never fabricates phase |
| reactor-depleted / Powers Depleted | New run; both inventories zero, no consumption/receipt fabricated | PLAYING; actual host/client rewarded completion still needed for +1 |
| reactor-force-win/fail | QA only, existing active PLAYING run, no ad/resolution/pending dialog | RESULT once, same run ID, UI/log/save once; another terminal command disabled; opposite result requires fresh explicit run |
| orbit-fresh / Fresh Run | Safe idle; existing menu/start flow | PLAYING after normal start boundary; normal ads may occur if eligible; fresh UUID |
| orbit-death / Force death | Active playing/paused run, no ad/pending transition | Real game-over/revive-decision path; offer depends on actual capability/run allowance |
| orbit-quest-ready | QA only; set first quest progress to its target, save through existing profile | Phase unchanged; no claim, XP or reward grant |
| orbit-legacy / fixed legacy | QA only, confirmed; remove QA profile, seed QA legacy best 420 | Reload exercises existing migration; ordinary keys untouched |
| orbit-corrupt / fixed corruption | QA only, confirmed; invalid QA profile JSON, QA legacy best 420 | Reload exercises existing recovery; ordinary keys untouched |

QA Reactor initialization uses an injected deterministic stream seeded 41; repeated runs advance that stream, and reload restarts it. Orbit QA hazard generation uses the same injected stream; production randomness remains Math.random. Fixed known-board fixtures remove board setup ambiguity, not reward or lifecycle requirements. Host receipts, shown ceilings, startup OFF, approved safe events, Unlimited defaults, finite overrides and reward guards remain authoritative.

## Prompt 4B boundaries

Use the patch checkout/commands in the dated handoff. Newly reachable groups include DEV-040/047/053, REA-022/device matrix layout assertions, PROD-008 mute verification, QA reset/focus/storage migration, diagnostics/config inspection and real resolving/reward prerequisites. Do not automatically pass remaining assertions in those rows or the 65 historical environment-blocked cases.

Still separate: LIVE after human merge/deploy; physical touch/orientation, subjective audio, assistive technology, OS/background behavior, long-session performance, cross-browser/native fullscreen; clipboard-specific tests; actual saved download bytes; production destructive tests in a disposable browser profile. Browser checks here are desktop emulation and targeted UI/state evidence. The prior source-less MutationObserver error remains unattributed; console-clean status is not verified.


## Current panel and product fix supplement

See [QA contract 0.5.0](qa-contract-0.5.0.md) for the MVP/Advanced split, selectors, minimum viewport and targeted human gate. This historical launcher/fixture contract remains intact.
