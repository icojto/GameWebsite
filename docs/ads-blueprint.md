# Odesos Ads v1.1 + Orbit Monetization v1 — MOCK ONLY

PROVIDER COMPLIANCE NOT YET REVIEWED. Orbit has a game-specific mock integration. No real provider is connected.

## Locked ownership

The website owns `AdService`, provider selection, Null/Mock provider logic, availability, eligibility, timers, cooldowns, caps, placement registry, session observations, event log, the non-modal Ad Dev Panel, website banners, iframe bridge and future provider integration.

The game owns gameplay, input freezing, audio muting/pausing, rewards/revive/power-ups, game-specific ad buttons, the game-side `GameAdPlayer`, and all MOCK courtesy/fullscreen visuals.

The website does not render fullscreen courtesy or mock ads. The original approved chibi source is preserved at `docs/design-reference/odesos-chibi-mascot.svg` for a game integration to copy/adapt. It is not a website runtime asset. `public/ads/ad-badge.svg` remains provider-neutral shared artwork for future in-game buttons.

Banner is the deliberate exception: `game-page-primary` stays website-rendered below the player/action bar and above game information. Null collapses it; DEV can show the obvious mock banner.

Mock presentation targets the game viewport. This does **not** assume a future real SDK renders inside the iframe. A real provider may own its overlay; the game still receives pause/mute/resume lifecycle. Provider logic and presentation surface remain separate.

## Service rules

- Startup is supported but fresh DEV configuration defaults **OFF**. Once/session and courtesy remain available. Migrating `odesos.dev.ads.v1` to `odesos.dev.ads.v1.1` preserves compatible values but forces startup OFF once, so the architecture correction never unexpectedly enables it.
- Interstitial defaults remain 180 seconds first eligibility, 180 interval and 180 cooldown, with Unlimited session frequency. Explicit `sessionLimitEnabled` gates numeric caps globally and on interstitial placements. Zero with the limit enabled blocks. Time only creates eligibility; a registered semantic safe event creates the opportunity.
- Active time counts only current game + `playing` + visible document + no active fullscreen lifecycle.
- Rewarded requires explicit player opt-in and a registered placement. Only an actually shown `completed` result qualifies. The game applies any reward. Placement enabled/cooldown/session caps are supported. A placement may also declare `maxPerRun`; when it does, the game must supply a validated `runId`, and the website enforces that run-specific cap without interpreting gameplay state.
- A shown rewarded ad resets/suppresses immediate interstitial cooldown by default.
- One fullscreen lifecycle at a time, including pending game presentation. Provider/service deadlines and game-presentation timeouts settle safely.
- Session observations are local to this page; only normalized DEV tuning persists. No global analytics, revenue or personal information exists.

Production creates only `NullAdAdapter`. DEV dynamically imports Mock/panel CSS. The production artifact scan rejects the panel, Mock adapter, mock banner, old website overlay identifiers/copy and DEV storage keys.

## GAME INTEGRATION CONTRACT

Protocol remains `odesos-ads`, version `1`. Messages use `postMessage(..., location.origin)` and exact payloads. IDs are 1–80 characters matching `[a-z0-9][a-z0-9._:-]*`. The website validates origin, current iframe source, protocol/version, exact keys/types, request/game/placement identity and duplicates.

### Registration and state

After load, the game sends:

```ts
{ protocol:'odesos-ads', version:1, type:'game-ready', requestId, gameId, presentationVersion:1 }
```

`presentationVersion: 1` registers a ready `GameAdPlayer`. Without it, normal bridge/state messages still work, but fullscreen Mock presentation returns `unavailable` with `game-presentation-unavailable`. The website responds `bridge-ready` and reports its supported presentation version.

The game sends fresh-ID `game-state` messages with `menu | playing | paused | game-over`. Report every meaningful transition. Send `game-event` with `event` and registered `placementId` only at reviewed safe transitions such as run-ended/restart-requested/new-game-requested. Do not map arbitrary buttons to interstitials.

Rewarded requests use `ad-request`, `adType:'rewarded'`, registered `placementId`, and `userInitiated:true`, directly from a deliberate player choice. A future placement configured with `maxPerRun` also includes the current opaque `runId`; the game owns when that identity changes. Game code stays provider-independent.

### Website → game presentation

After provider preparation succeeds, the website sends `ad-will-show`, then:

```ts
{
  protocol:'odesos-ads', version:1, type:'ad-presentation-request',
  requestId, gameId, placementId, adType,
  courtesy:{ enabled, preset, durationMs, mascot, animation },
  mock:{ durationMs, outcome }
}
```

No provider secrets or internal service state are sent. Before acknowledging presentation, the game must preserve run state, freeze simulation/input and pause/mute game audio appropriately. Underlying actions must not fire.

The game replies, using the same request/game/placement identity, in this lifecycle:

1. `ad-presentation-ready`
2. Optional `ad-courtesy-started`
3. `ad-presentation-shown`
4. Exactly one terminal `ad-presentation-completed`, `ad-presentation-closed`, or `ad-presentation-failed`

The website may send `ad-presentation-cancel` on route/frame/provider cancellation. The game must immediately remove its presentation and restore a safe state without granting a reward. Duplicate, stale, out-of-order, wrong-origin/source or mismatched identity messages are ignored.

The game presentation readiness timeout is DEV-configurable (default 5,000 ms, bounded 500–15,000). After `ready`, the broker allows the configured courtesy + mock duration + that timeout margin. `timeoutMs` is an additive payload field for the client watchdog. This corrects the old default five-second deadline being shorter than a one-second courtesy plus five-second mock. No renderer returns `game-presentation-unavailable`; no terminal response returns `game-presentation-timeout`. Startup/interstitial integrations continue their intended transition. Rewarded returns to its decision state with no reward.

### Pause/audio and final result

Treat `ad-will-show` as the pre-presentation pause signal: freeze active gameplay, disable gameplay input, pause/mute game audio and preserve state. GameAdPlayer then renders courtesy (if enabled) and the obvious unbranded mock visual entirely inside the iframe.

After `ad-result`, the game owns the correct continuation:

- startup: begin normally for every failure/unavailable/timeout/close result;
- interstitial: continue the safe transition/new run for every result;
- rewarded: apply its idempotent reward only for `completed` plus `rewardQualified:true`; every other result grants nothing.

After applying a qualified reward exactly once, send `reward-granted` with a new message `requestId`, the qualifying `adRequestId`, and `placementId`. Restore the correct game state/input/audio after the result is handled. Use a game-side timeout fallback as additional fail-open protection.

## Ad Dev Panel

`Ctrl+Shift+A` opens a fixed non-modal `complementary` inspector. It does not use `<dialog>`, `showModal`, a backdrop, inertness or focus trapping. The drawer alone receives its normal pointer area; website and iframe remain interactive elsewhere. It overlays without changing the player rectangle. Escape closes it. At <=600px it becomes a near-full-height bottom sheet without intentionally disabling the remaining page.

Sections are Overview, Placements, Startup, Interstitial, Rewarded, Banner, Courtesy, Simulation and Events. Overview explicitly shows `Presentation surface: GAME`, current game and renderer readiness. Placements exposes generic enabled/cooldown/session-cap/run-cap controls, read-only safe events and counters. Tuning is session-only, cannot change a placement's declared run-cap ceiling, and is disabled during an active request. Courtesy previews are disabled until a game renderer registers. Fullscreen tests exercise provider/service/bridge logic and never open a website overlay. Explicit DEV previews have `preview:true`, suspend the game, and cannot grant gameplay rewards.

## Historical Prompt 3 integration contract

Read `src/ads/model.ts`, `src/ads/bridge.ts`, `src/ads/presentation.ts`, this **GAME INTEGRATION CONTRACT**, and `docs/ads-qa.md`. Protocol is `odesos-ads` version 1.

Inside `games/orbit-break` only, implement one provider-independent `GameAdPlayer`. On game load send `game-ready` with `presentationVersion:1`; report menu/playing/paused/game-over accurately. Register/use only website-approved Orbit placements and safe semantic events. Receive `ad-presentation-request`, verify its request/game/placement/type fields, freeze Phaser simulation/input, preserve the run, and pause/mute Orbit audio. Render courtesy/chibi and the MOCK AD surface inside Orbit's iframe, respecting reduced motion. Source the approved design from `docs/design-reference/odesos-chibi-mascot.svg`.

Send ready, optional courtesy-started, shown, and exactly one terminal lifecycle message. Handle cancel/result idempotently, restore audio/input/state, and fail open. For rewarded, grant the Orbit-defined reward once only after matching `completed` + `rewardQualified:true`, then acknowledge it. Close/failure/no-fill/timeout/unavailable/blocked grant nothing.

Do **not** duplicate AdService, provider selection, timers, cooldowns, session caps, statistics, event logging, website banner logic or provider SDK code in Orbit. Do not add a page-level overlay. Orbit-specific revive frequency/defaults belong to Prompt 3; Reactor integration remains Prompt 4.

Still deferred: every real provider/SDK, AdSense/H5 APIs, publisher IDs, CMP/TCF/consent, privacy/terms/cookies/ads.txt, tracking, real analytics and revenue reporting.

## Implemented Orbit reference (Prompt 3)

The wire `gameId` is **`orbit-break`**, the established host's catalog slug, not catalog display ID `game-001`. `src/ads/placements.ts` is the website-owned registry:

| Placement | Type | Enabled | Safe event | Cooldown | Session cap | Run cap |
| --- | --- | --- | --- | --- | --- | --- |
| `orbit.startup` | startup | true | none | 0s | 1 | none |
| `orbit.play-interstitial` | interstitial | true | `play-requested` | 0s | Unlimited | none |
| `orbit.restart-interstitial` | interstitial | true | `restart-requested` | 0s | Unlimited | none |
| `orbit.revive` | rewarded | true | explicit opt-in | 0s | 100 | 1 shown attempt |

Placement caps do not replace global caps. Interstitial remains 180/180/180 seconds, Unlimited/session; rewarded remains ten/session; global startup stays OFF by default. RESET STARTUP clears its global requested flag, not the placement's shown cap. For repeated startup QA reload the page or explicitly tune its DEV placement cap.

## Patch 03.1 corrections

Fresh/reset global settings and both real Orbit/generic DEV interstitial placements are Unlimited. Explicit finite caps retain actual shown history across toggles and Clear Stats. Legacy numeric global settings without the new flag retain their limit until a non-modal choice: **Use new default** / **Keep my existing limit**. Only the cap choice changes; timing/courtesy/mock preferences and game saves are untouched. Global settings persist in `odesos.dev.ads.v1.1`; placement tuning remains page-session-only. The existing 2,000-request/replay safety budget and 200-event ring remain bounded safeguards, not configurable ad-frequency caps; a sufficiently long QA page session may need reload.

Startup/interstitial mock views have no player close/skip control and complete automatically. Rewarded alone offers **Skip — no reward**. Confirmed rewarded player skip sends optional `reason:'player-skip'` only on a shown closed lifecycle; injected close uses `external-close`. Other cancellation remains CLOSED/CANCELLED, never inferred SKIPPED. Exactly-once reward/receipt/run-cap handling is unchanged. QA abort, watchdog, master disable and navigation still recover safely. These mock rules make no assumption about a future SDK's mandatory controls.

The panel separates Current/Reason from Last result/Last reason, shown/completed observations, active wait/cooldown and placement restrictions. Renderer connected is not prepared READY. Banner uses visibility/shown observations, not completion. DEV previews never count as game reward acknowledgments. Grouped readout help avoids making every changing statistic a keyboard stop; all website editable controls/actions and Orbit Ads Integration entries have specific help. The small shared help utility mounts independently inside each owner document, with delayed hover, focus, tap pin, Escape-first dismissal and viewport clamping. No cross-iframe help DOM is used.

See [controls reference](ads-controls-reference.md) for exact shortcut/bypass semantics and [current QA](ads-qa.md). Prompt 4 must inherit explicit unlimited-cap support, these status/help conventions, non-skippable startup/interstitial mocks and rewarded skip-without-reward. Reactor integration is not implemented here.

`bridge-ready` and additive `ad-capabilities` carry `providerMode` (`null|mock|real`), `fullscreenAvailable`, `rewardedAvailable`, and `startupDue`. Capability changes follow host configuration and results; DEV preview placements never create gameplay availability. Capabilities are UI hints, not eligibility authorization: the host rechecks every request. A `bridge-hello` after bind/reload requests a fresh handshake. In DEV Orbit advertises presentation v1 only after its view is mounted. In production the mock view is removed and the ordinary ready handshake omits presentationVersion rather than advertising a nonexistent renderer; Null cannot request one. Unsupported/malformed messages fail closed.

`games/orbit-break/src/ads/OrbitAdClient.ts` checks exact origin, parent source, schema, request/game/placement/type/run identity, lifecycle ordering and duplicate receipts. `protocol.ts` is the game-owned wire contract, not an imported host implementation. States are reported only on transitions (or a fresh handshake). Its request watchdog and host cancellation remove the presentation and release internal suspension. A future real provider can use the same will-show/result lifecycle without the mock view.

`GameAdPlayer.ts` has no provider, reward or run knowledge. It sequences an injected view with host-supplied timing. `ads/dev/MockAdView.ts` and `presentation.css` render the approved courtesy SVG, type-aware friendly/concise copy, optional mascot/animation, and unmistakable MOCK AD countdown. CSS reduced motion disables visual animation without changing timers. Ready, optional courtesy, shown and one terminal form the lifecycle. Cancellation clears all timers and focus/input state. The view's entire asset/CSS import graph is DEV-only.

`OrbitAdFlow.ts` owns one locked start transition and a stable UUID per actual new run. All explicit PLAY/RESTART, canvas click/tap and Space paths reach it. Menu PLAY considers due startup first; once selected, any startup completion/failure/close starts without a second interstitial. A not-applicable eligibility rejection may fall through to PLAY's safe event. Restart finalizes the old run, then requests `restart-requested`; death itself never requests an interstitial.

On death an available, unused revive offers eight seconds. Pending request, courtesy and presentation freeze that timer. Only matching, shown `completed + rewardQualified` continues the same run, then sends one acknowledgment. A shown attempt consumes the run cap even if closed/failed. A pre-show failure retains at least three seconds of grace; the host still rechecks caps. Revive preserves score/time/difficulty/direction, clears hazards, grants 1.5 seconds of collision protection, and delays the next attack by its normal interval plus one second. A second death has no revive offer.

Permanent finalization happens on offer expiry, shown nonreward outcome, death without an available offer, restart, or menu. The guarded hook calls `ProfileStore.recordFinishedRun`: runs quest +1, max-score progress, one score entry if positive, and one save (including zero-score quest progress). Successful revive does none of these. Existing survive/reverse/dodge/difficulty progress and periodic saves remain unchanged. UUID changes only on a new run, never on revive.

Scene suspension is separate from ordinary pause: Phaser updates/input stop, ordinary UI and game DEV controls become inert, and the audio master is muted while music scheduling stops. Settings are preserved. The resulting run phase determines music restart. No PAUSED dialog is opened by an ad. The renderer traps only its own Tab/Escape/Space handling; the website Ad Dev inspector remains non-modal.

Why Ads is a menu-only, closable, keyboard-accessible mock-phase explanation, hidden with Null. Real-provider privacy/consent/legal copy remains a separate reviewed rollout. Orbit's Ads Integration category owns only offer seconds (3–20/default8), protection (.5–5/default1.5), extra attack delay (0–5/default1), diagnostics, force death, local-used reset and menu-only Why Ads preview. Local reset never overrides the host run cap.

## Prompt 4 — Reactor reuse boundary

Reuse the **patterns** in `ads/protocol.ts`, `OrbitAdClient.ts`, `GameAdPlayer.ts`, `ads/dev/MockAdView.ts`, `ads/dev/presentation.css`, and the approved `assets/ad-badge.svg` / `assets/odesos-chibi-mascot.svg`. In particular: strict authenticated lifecycle; capability-driven controls; same-origin parent transport; request locks/watchdogs; suspended input/audio restoration; courtesy-before-mock sequencing; reduced motion; exactly-once terminals/reward acknowledgment. Website providers, registry, timers, caps, banners and diagnostics remain shared already.

Reactor must define its own game identity, reviewed placements/safe transitions, board-state preservation, reward effects, limits, finalization and input/audio adapters. Do not copy Orbit's revive/run/score rules into Reactor. Compare both integrations before extracting a cross-game package; no speculative shared framework was added here.
