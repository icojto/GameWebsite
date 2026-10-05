# Odesos Ads v1.1 architecture — MOCK ONLY

PROVIDER COMPLIANCE NOT YET REVIEWED. No real provider or game-specific monetization is connected.

## Locked ownership

The website owns `AdService`, provider selection, Null/Mock provider logic, availability, eligibility, timers, cooldowns, caps, placement registry, session observations, event log, the non-modal Ad Dev Panel, website banners, iframe bridge and future provider integration.

The game owns gameplay, input freezing, audio muting/pausing, rewards/revive/power-ups, game-specific ad buttons, the game-side `GameAdPlayer`, and all MOCK courtesy/fullscreen visuals.

The website does not render fullscreen courtesy or mock ads. The original approved chibi source is preserved at `docs/design-reference/odesos-chibi-mascot.svg` for a game integration to copy/adapt. It is not a website runtime asset. `public/ads/ad-badge.svg` remains provider-neutral shared artwork for future in-game buttons.

Banner is the deliberate exception: `game-page-primary` stays website-rendered below the player/action bar and above game information. Null collapses it; DEV can show the obvious mock banner.

Mock presentation targets the game viewport. This does **not** assume a future real SDK renders inside the iframe. A real provider may own its overlay; the game still receives pause/mute/resume lifecycle. Provider logic and presentation surface remain separate.

## Service rules

- Startup is supported but fresh DEV configuration defaults **OFF**. Once/session and courtesy remain available. Migrating `odesos.dev.ads.v1` to `odesos.dev.ads.v1.1` preserves compatible values but forces startup OFF once, so the architecture correction never unexpectedly enables it.
- Interstitial defaults remain 180 seconds first eligibility, 180 interval, 180 cooldown, maximum three shown/session. Time only creates eligibility; a registered semantic safe event creates the opportunity.
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

The game presentation timeout is DEV-configurable (default 5,000 ms, bounded 500–15,000). No renderer returns `game-presentation-unavailable`; no terminal response returns `game-presentation-timeout`. Startup/interstitial integrations continue their intended transition. Rewarded returns to its decision state with no reward.

### Pause/audio and final result

Treat `ad-will-show` as the pre-presentation pause signal: freeze active gameplay, disable gameplay input, pause/mute game audio and preserve state. GameAdPlayer then renders courtesy (if enabled) and the obvious unbranded mock visual entirely inside the iframe.

After `ad-result`, the game owns the correct continuation:

- startup: begin normally for every failure/unavailable/timeout/close result;
- interstitial: continue the safe transition/new run for every result;
- rewarded: apply its idempotent reward only for `completed` plus `rewardQualified:true`; every other result grants nothing.

After applying a qualified reward exactly once, send `reward-granted` with a new message `requestId`, the qualifying `adRequestId`, and `placementId`. Restore the correct game state/input/audio after the result is handled. Use a game-side timeout fallback as additional fail-open protection.

## Ad Dev Panel

`Ctrl+Shift+A` opens a fixed non-modal `complementary` inspector. It does not use `<dialog>`, `showModal`, a backdrop, inertness or focus trapping. The drawer alone receives its normal pointer area; website and iframe remain interactive elsewhere. It overlays without changing the player rectangle. Escape closes it. At <=600px it becomes a near-full-height bottom sheet without intentionally disabling the remaining page.

Sections remain Overview, Startup, Interstitial, Rewarded, Banner, Courtesy, Simulation and Events. Overview explicitly shows `Presentation surface: GAME`, current game and renderer readiness. Courtesy previews are disabled until a game renderer registers. Fullscreen tests exercise provider/service/bridge logic; without Prompt 3 they report `game-presentation-unavailable` and never open a website overlay.

## PROMPT 3 — ORBIT INTEGRATION HANDOFF

Read `src/ads/model.ts`, `src/ads/bridge.ts`, `src/ads/presentation.ts`, this **GAME INTEGRATION CONTRACT**, and `docs/ads-qa.md`. Protocol is `odesos-ads` version 1.

Inside `games/orbit-break` only, implement one provider-independent `GameAdPlayer`. On game load send `game-ready` with `presentationVersion:1`; report menu/playing/paused/game-over accurately. Register/use only website-approved Orbit placements and safe semantic events. Receive `ad-presentation-request`, verify its request/game/placement/type fields, freeze Phaser simulation/input, preserve the run, and pause/mute Orbit audio. Render courtesy/chibi and the MOCK AD surface inside Orbit's iframe, respecting reduced motion. Source the approved design from `docs/design-reference/odesos-chibi-mascot.svg`.

Send ready, optional courtesy-started, shown, and exactly one terminal lifecycle message. Handle cancel/result idempotently, restore audio/input/state, and fail open. For rewarded, grant the Orbit-defined reward once only after matching `completed` + `rewardQualified:true`, then acknowledge it. Close/failure/no-fill/timeout/unavailable/blocked grant nothing.

Do **not** duplicate AdService, provider selection, timers, cooldowns, session caps, statistics, event logging, website banner logic or provider SDK code in Orbit. Do not add a page-level overlay. Orbit-specific revive frequency/defaults belong to Prompt 3; Reactor integration remains Prompt 4.

Still deferred: every real provider/SDK, AdSense/H5 APIs, publisher IDs, CMP/TCF/consent, privacy/terms/cookies/ads.txt, tracking, real analytics and revenue reporting.
