# Orbit Break Monetization v1 — Prompt 3 handoff

MOCK INTEGRATION ONLY. NOT MERGED. Human merge only.

## Preflight and isolation

- Repository: `icojto/GameWebsite` (`https://github.com/icojto/GameWebsite`).
- Dedicated linked checkout: `C:\Users\mlgjm\Desktop\GameTests\GameWebsite-Orbit-Monetization-v1`.
- Branch: `codex/orbit-monetization-v1`, based on `origin/main` at `0db5c73e5e72342685d378813c22dea68011ce14`.
- Live preflight confirmed Ads v1.1 PR #16 and Orbit v2 PR #12 merged. Baseline 70/70 tests passed before implementation. Original checkout and sibling games were not edited.
- No dependency additions, provider SDK, backend, accounts, analytics, payments, cloud infrastructure, catalog/player sizing redesign or real ad network.

## Architecture and request flows

The website owns the four placement definitions, AdService policy, provider availability, active-play time, eligibility/cooldowns/caps, diagnostics, banners and authenticated iframe transport. Its established wire identity is the catalog **slug `orbit-break`**. The display/catalog ID `game-001` is not substituted into the bridge.

`OrbitAdClient` owns game-side validation, capability hints, pending identity/lifecycle, internal suspension, timeout recovery, and one-time receipts. `GameAdPlayer` only sequences an injected presentation view. `OrbitAdFlow` owns run start, death decisions, permanent finalization and revive effects. No game imports host service/provider internals.

Handshake: mounted DEV renderer sends `game-ready` with presentationVersion1; parent returns bridge-ready plus providerMode/fullscreenAvailable/rewardedAvailable/startupDue. Host bind/reload sends bridge-hello to avoid load races. Capability updates are additive v1 messages. Production omits renderer support from its ready message because the DEV mock view has been tree-shaken; Null does not request fullscreen visuals. Ordinary state reporting works in both builds.

Menu PLAY (button, Space, canvas click/tap) enters a single pending lock. Due startup is considered first. A selected startup's complete/close/failure/no-fill/timeout/unavailable result always starts the run without another fullscreen ad. Only a not-applicable eligibility rejection may fall through to `play-requested`. Without due startup, the host decides PLAY interstitial eligibility. No ad timer triggers gameplay interruption.

Death reports game-over but does not request interstitial. Restart finalizes the old run and sends `restart-requested`; any result continues to a fresh run UUID. Menu also finalizes exactly once. Normal pause/settings do not constitute ad opportunities.

| Placement | Type | Enabled | Safe event | Placement cooldown | Session / run cap |
| --- | --- | --- | --- | --- | --- |
| orbit.startup | startup | true | none | 0s | 1 / none |
| orbit.play-interstitial | interstitial | true | play-requested | 0s | 100 / none |
| orbit.restart-interstitial | interstitial | true | restart-requested | 0s | 100 / none |
| orbit.revive | rewarded | true | explicit user opt-in | 0s | 100 / 1 shown attempt |

Global startup remains OFF; global interstitial 180s first/interval/cooldown and three/session, rewarded ten/session still govern. Placement caps are additional ceilings, not bypasses. Generic DEV preview placements never create gameplay rewarded availability.

## Revive, accounting, suspension

Default offer eight seconds, frozen while request/courtesy/mock is pending. Request includes userInitiated=true and current runId. A matching shown completed+qualified response clears hazards, resumes the same score/time/difficulty/direction, adds 1.5s protection and normal attack interval +1s delay, then acknowledges once. Every shown attempt consumes the run cap. A pre-show failure grants at least three seconds of decision grace. Duplicate, stale, mismatched and nonqualified results cannot reward.

Run finalization is guarded independently of death. It occurs at expiry, shown nonreward result, no-offer death, restart or menu. It records one positive score, increments runs quest once, updates max-score progress and saves once; zero-score runs still save quest progress. Successful revive does not finalize, save a finished score or increment completed runs. Existing continuous quest progress/save behavior remains intact. UUID changes only on actual new-run start.

Ad suspension is not the ordinary pause screen: simulation/input stop, gameplay UI/DEV surface is inert, music scheduling stops and master gain is zero without changing user settings. Completion/cancel/timeout restores the appropriate phase. No ad-induced PAUSED dialog. Shutdown removes client/listeners/view/timers; presenter and host cancellation are idempotent. Renderer readiness deadline now expands after ready to include configured courtesy and mock duration plus margin; this fixes the old five-second deadline cutting off the default six-second presentation.

## Presentation and tools

Approved chibi and AD badge are copied into Orbit assets; host reference assets are unchanged. DEV-only view displays type-specific courtesy copy, friendly/concise preset, optional mascot/animation, and clear MOCK AD countdown/close control. Reduced-motion CSS is static; lifecycle never depends on animation completion. CSS adapts within the existing iframe on resize without rebuilding the request.

Why Ads is a menu-only closable dialog with mock-phase text and focus restoration, hidden under Null. New action buttons are at least 44px high. Small-screen DEV trigger was moved above the menu to avoid covering Why Ads.

Orbit DEV Ads Integration: run ID, consumed flag, suspension, bridge, capabilities, last result; offer3–20/default8; protection.5–5/default1.5; extra attackdelay0–5/default1; force death; local-used reset; Why Ads preview. No host timing knobs. Website PLACEMENTS: enabled/cooldown/session-cap/run-cap, read-only safe events and live counters; session-only tuning and immutable registered run-cap ceiling. Existing global policy controls remain in the host. Generic host previews can suspend/present but never reward the game.

## Verification

All commands run at the dedicated checkout root:

```powershell
npm.cmd run check
node --experimental-transform-types --test tests/ads.test.mjs tests/portal.test.mjs tests/orbit-v2.test.mjs tests/orbit-ads.test.mjs games/reactor-stack/tests/game.test.ts
npm.cmd run build
npm.cmd run verify:ads-production
npm.cmd run verify:pages
git diff --check
```

PASS: 124/124 tests (original70 + Orbit ads54), TypeScript/all game checks, build, production boundary (32 artifacts), Pages/routes/assets, whitespace. CI now runs `test:orbit-ads` before the existing build/deploy steps; deployment remains main-only and was not triggered by this branch.

Browser PASS: DEV ready/capabilities; startup in iframe; eligible PLAY and RESTART; early-close recovery; approved courtesy; rewarded completion with identical before/after UUID and consumed flag; second death without offer; no death interstitial; Escape did not open pause during ad; Why Ads; active-ad desktop→360px resize without restarting countdown; production Null Space-start/pause; Reactor production Initialize.

Six viewport overrides checked: 360×640, 640×360, 390×844, 844×390, 768×1024, 1366×768. No iframe overflow observed. Existing host vertical scrolling remains intentional in short landscape. See `docs/ads-qa.md` for dimensions, precise coverage boundaries and reproducible human steps. UI checks used the browser automation surface after the computer-use guidance directed browser tasks there; no browser automation dependency was installed.

NOT VERIFIED: physical Android/iPhone touch/audio, subjective audio balance, OS reduced-motion behavior, assistive technology, background transitions, native-fullscreen visual fidelity and long soak. The source-less MutationObserver.observe TypeError from the earlier baseline remains visible in DEV and production; repository search found no matching source, but attribution is unresolved. Do not claim console-clean. No exhaustive browser network capture was available; code/artifact checks and Null-provider behavior are verified, not a full traffic audit. Phaser's existing large-chunk warnings remain.

No real provider, revenue, legal/CMP/TCF/privacy/consent approval or compliance claim. Real integration is explicitly deferred.

## Complete changed-file manifest

| File | Purpose |
| --- | --- |
| `.github/workflows/pages.yml` | Run new integration tests; retain main-only deployment |
| `docs/ads-blueprint.md` | Actual protocol/placement/ownership and Reactor reference |
| `docs/ads-qa.md` | Gate evidence, viewport matrix, honest limits, human procedure |
| `docs/patches/2026-10-05-orbit-monetization-v1.md` | This preflight/implementation/verification handoff |
| `games/orbit-break/README.md` | Full-host DEV workflow and production behavior |
| `games/orbit-break/src/ads/protocol.ts` | Strict game-side message types/schema and capabilities |
| `games/orbit-break/src/ads/OrbitAdClient.ts` | Transport, state, lifecycle, watchdog, reward receipts |
| `games/orbit-break/src/ads/GameAdPlayer.ts` | Provider-independent presenter controller |
| `games/orbit-break/src/ads/OrbitAdFlow.ts` | Locked starts, death offer, revive, finalization |
| `games/orbit-break/src/ads/dev/MockAdView.ts` | DEV courtesy/mock DOM and focus handling |
| `games/orbit-break/src/ads/dev/presentation.css` | Responsive ad surface and reduced motion |
| `games/orbit-break/src/assets/ad-badge.svg` | Approved opt-in AD icon |
| `games/orbit-break/src/assets/odesos-chibi-mascot.svg` | Approved game-side courtesy asset |
| `games/orbit-break/src/dev/DevPanel.ts` | Ads Integration category and inert keyboard guard |
| `games/orbit-break/src/dev/dev.css` | Keep small-screen DEV trigger clear of menu |
| `games/orbit-break/src/dev/orbit.ts` | Game-owned ad controls/diagnostics; safe DEV restart |
| `games/orbit-break/src/game/OrbitBreakScene.ts` | Mount transport/presenter/flow and suspend simulation/input |
| `games/orbit-break/src/game/audio.ts` | Preserve settings across master mute/music suspension |
| `games/orbit-break/src/game/profile.ts` | Single permanent-run accounting hook, including score zero |
| `games/orbit-break/src/game/run.ts` | Hazard clearing, collision protection, delayed attack |
| `games/orbit-break/src/game/ui.ts` | PLAY/RESTART/revive/timer/Why Ads and input locks |
| `games/orbit-break/src/style.css` | Responsive actions/decision UI, focus/touch sizing |
| `package.json` | `test:orbit-ads` command only; no dependencies |
| `scripts/verify-ads-production.mjs` | Extend mock/DEV/SDK artifact rejection |
| `src/ads/placements.ts` | Website-owned four Orbit registrations |
| `src/ads/service.ts` | Capability snapshot and bounded generic DEV placement tuning |
| `src/ads/bridge.ts` | Additive capabilities and explicit no-reward DEV preview lifecycle |
| `src/ads/runtime.ts` | Register placements and reload-safe hello handshake |
| `src/ads/presentation.ts` | Ordered courtesy/shown state and duration-aware deadlines/cleanup |
| `src/ads/dev/panel.ts` | Placement controls, counters and registry mounting |
| `tests/ads.test.mjs` | Preserve existing tests with additive wire expectations |
| `tests/orbit-ads.test.mjs` | 54 policy/lifecycle/flow/accounting/audio/regression cases |
| `vite.config.mjs` | Serve DEV Orbit in host iframe; preserve production routes/builds |

## Prompt 4 handoff

Reactor should reuse the design of protocol/client/presenter, DEV courtesy/mock view/CSS, approved assets, capability-driven CTA gating, authenticated identity/order checks, exactly-once terminals/receipts, and separate input/audio suspension. Keep provider/timers/caps/banner ownership in the website. Reactor must supply its own slug, placements, semantic transitions, reward semantics, board preservation/finalization and input/audio adapters. Do not reuse Orbit run/score/revive effects blindly. No speculative shared extraction was performed; decide after comparing both games.

## Git handoff

One feature branch and one Draft PR targeting `main`; no merge and no deployment. Final commit SHA, diff stat and PR URL are reported in the chat/PR after the final commit, avoiding a self-referential SHA in this file.
