# Odesos ad blueprint v1 — MOCK ONLY

PROVIDER COMPLIANCE NOT YET REVIEWED. No real ad provider or gameplay monetization is connected.

## Ownership and entry points

`src/ads/runtime.ts` creates the website-owned `AdService`, binds only the current public game's iframe, and detaches listeners on route/frame changes. The website owns configuration, eligibility, provider access, concurrency, courtesy and mock dialogs, banners, event history, and session observations. Games own gameplay, pausing, rewards and their own Dev Panels. There is no general Website Dev Panel or Admin Panel.

The small provider contract exposes `initialize`, `isReady`, `prepareAd`, `showAd`, banner show/hide and `destroy`. A future adapter must honor AbortSignal, call `shown` only when an ad really appears, and return an explicit result. The service applies a 30-second request deadline and catches provider failures. A real provider will require a deliberate reviewed implementation, initialization/failure handling, and provider-specific timing; it is not a configuration switch today.

Production creates `NullAdAdapter` only: unavailable, immediate, no UI. The entire mock adapter, panel, CSS and mascot graph is behind Vite's `import.meta.env.DEV` dynamic import. Local saved settings cannot activate it in production. `npm.cmd run build` scans the finished artifact for forbidden development signatures, including copied game assets. CI also runs unit tests before the existing main-only deployment. No feature-branch deployment is added.

## Rules and defaults

- Startup: enabled in mock DEV, one attempt per page session, courtesy on. Requested/shown/completed are separate. A failed first attempt consumes once/session to avoid repeat interruptions; gameplay must start for every result.
- Interstitial: first threshold 180 active seconds, interval 180, fullscreen cooldown 180, cap 3 shown/session. A timer only changes eligibility. A registered safe semantic event is required for an actual request. The generic DEV registry uses `run-ended`, `restart-requested`, `new-game-requested`; game integrations must explicitly register their reviewed placements/events.
- Active time: accumulates only with a current game, reported `playing`, visible document, and no fullscreen request in progress. Menu/paused/game-over/unknown/background time does not count. It is shared across SPA game navigation. Cooldowns use monotonic wall time (including time away), separately from active-play thresholds.
- Rewarded: explicit `userInitiated: true`, enabled, default global cooldown 0 and cap 10 shown/session. Placement enabled/cooldown/cap are independently enforced. Only `completed` after actual showing qualifies. `closed`, `failed`, `no_fill`, `timeout`, `unavailable`, `blocked` never qualify. Service never applies gameplay rewards.
- Showing a rewarded ad resets interstitial cooldown by default, even if subsequently closed, to avoid a second interruption. This is switchable. Caps count shown ads, not preparation failures.
- At most one fullscreen request (including preparation/courtesy) can run. Banner state is independent. Route changes, reload and teardown cancel active requests without qualification.
- Clearing statistics does not reset startup state, caps, cooldowns, request IDs or reward receipts. Reload begins a new in-memory page session. No historical/global analytics are stored.

## Versioned iframe contract

Use `postMessage(message, location.origin)` from the first-party iframe. No wildcard target, parent DOM access or provider logic is needed in games. `gameId` is the catalog **slug**, e.g. `orbit-break`, not `game-001`.

Every game message has exactly these base fields:

```ts
{ protocol: 'odesos-ads', version: 1, type, requestId, gameId }
```

IDs are 1–80 characters matching `[a-z0-9][a-z0-9._:-]*` (case-insensitive). Use a fresh ID for each message, including state reports and acknowledgments. At most 2,000 messages per iframe binding and 2,000 admitted ad request IDs per page session are retained; exceeding these bounds fails closed for ads, not gameplay. Event history retains 200 records; the panel displays the latest 60.

| Game → site type | Additional fields |
| --- | --- |
| `game-ready` | none; host answers `bridge-ready` |
| `game-state` | `state`: menu / playing / paused / game-over |
| `game-event` | `event`, `placementId`; evaluates an interstitial safe transition |
| `ad-request` | `adType`: startup / interstitial / rewarded, `placementId`, optional boolean `userInitiated`, optional `safeEvent` |
| `reward-granted` | `adRequestId`, `placementId`; acknowledgment only |

Origin, current iframe `event.source`, protocol/version, exact keys, primitive types, game ID and request ID are checked before dispatch. The service checks placement ownership/type/enabled state and semantic-event registration. Malformed/untrusted messages are ignored; valid but ineligible requests return `ad-blocked` and final `ad-result`. Duplicate IDs do not execute twice. A disposed bridge cannot send a late response into a new game.

Site → game lifecycle: `ad-accepted` → prepare → `ad-will-show` → optional courtesy → `ad-shown` → `ad-result`. Preparation failures skip `ad-will-show` and courtesy. Final results include request/game/placement/type, `result`, `rewardQualified` and optional `reason`. All messages retain protocol/version and use the exact origin.

Future game responsibilities:

1. Register reviewed placements in the website integration, then send readiness/state reports from the game.
2. Startup/interstitial: await a final result with a game-side timeout fallback and continue the transition for **every** result.
3. Freeze input/simulation/audio appropriately on `ad-will-show`. Restore the correct game decision state on every result, including cancellation and timeout.
4. Rewarded: request only from a deliberate player action. Grant the game-defined reward at most once for matching `completed` + `rewardQualified: true`; otherwise restore its reward-choice state. Send acknowledgment with its own ID and the completed `adRequestId`.

This is a trusted first-party bridge, not an anti-cheat or cross-origin security sandbox. `userInitiated` is a game assertion, not proof of browser user activation. A same-origin compromised script is outside this trust boundary. Games are **not wired to this contract in this patch**, so mock DEV tests do not actually pause their simulations or grant anything.

## Website UI

One hidden `game-page-primary` slot sits after the player/action bar and before game information. The mock banner is responsive and never inside the iframe. Null leaves it hidden without an empty reserved ad area. Each actual mount/show counts one local mock impression.

Courtesy is shown only after readiness. DEV defaults: 1,000 ms (clamped 400–2,500), all fullscreen types on, never banners. The original source-only SVG chibi has expressive eyes, blush and a sweat drop. Friendly/concise copy presets are available. Motion can be switched off and `prefers-reduced-motion: reduce` suppresses the small mascot animation. No pressure-to-support copy or provider approval claims are made.

Native modal dialogs make underlying site/iframe input inert, trap focus, and restore sensible focus. Escape/cancel closes courtesy/mock without reward. The panel is a right overlay drawer on desktop and a near-fullscreen bottom sheet at <=600px; opening it does not change the player rectangle. `Ctrl+Shift+A` or the DEV-only `AD DEV` button opens it. Same-origin iframe keyboard forwarding is limited to this shortcut; `Ctrl+Shift+D` is untouched.

Sections: Overview, Startup, Interstitial, Rewarded, Banner, Courtesy, Simulation, Events. Simulation provides explicit generic requests, state reporting, eligibility/cooldown resets and a clearly labelled force-interstitial bypass. Force cannot bypass origin validation, placement ownership, master enable, concurrency or hidden-document restrictions. No arbitrary website click triggers ads.

NEXT RESULT is one-shot: Complete, Close early, Load error, No fill, Timeout, Unavailable; after consumption it resets to Complete. Mock loading delay is 0–5,000 ms, duration 500–15,000 ms. Close-early automatically ends halfway, or the tester can close/Escape sooner. Simulated Timeout resolves deterministically after the configured preparation delay; unit tests separately cover a provider that actually hangs until the deadline.

Only normalized tuning values persist using the existing safe storage helper under `odesos.dev.ads.v1`. Reset defaults restores configuration, not session safety state. Statistics/event history remain in memory and describe this page session/observation window only. The panel shows counts by ad type and placement, blocked reasons, eligibility transitions, preparation success, rewarded completion and reward acknowledgments. It knows nothing about real traffic, users, worldwide impressions or revenue. Log timestamps are ISO UTC; durations use a monotonic clock. No personal data is collected.

## Reusable badge

`public/ads/ad-badge.svg` is original provider-neutral `▶ AD` vector artwork. Future buttons must retain visible ad wording and an accessible action label such as “Watch ad to [specific reward]”; do not rely on the icon alone. Use `alt=""` when the surrounding button already describes the ad action, or `alt="Ad"` if the icon conveys otherwise missing meaning. Keep readable sizing/contrast. Neither game uses the badge yet.

## Deliberately deferred

Orbit monetization integration → Prompt 3. Reactor monetization integration → Prompt 4.

Not implemented: real provider/Google or other SDK, Google H5 Games Ads, AdSense, publisher IDs/API keys, CMP, TCF, consent, privacy policy, terms, cookie policy, ads.txt, tracking, real analytics, revenue reporting, backend rewards or global analytics. No third-party calls are made by this subsystem. Provider policy/compliance and production wording require a separate serious review.

See [QA checklist](ads-qa.md) and [patch log](patches/2026-10-04-odesos-monetization-blueprint-v1.md).
