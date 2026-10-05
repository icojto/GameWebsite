# Odesos Ads v1.1 boundary fix

Focused correction based on merged PR #15. Base main: `cd6e6732027d1fcacf16ef7ec3486595f8f6f886`. Human merge only.

## Why

The v1 service/eligibility architecture remains approved, but a modal website drawer blocked the underlying portal and its Mock adapter rendered fullscreen courtesy/ads over the entire page. v1.1 makes the panel non-modal and moves MOCK presentation ownership into a versioned game-side contract. Website banners remain the explicit exception.

## Changes

- Replaced modal `<dialog>.showModal()` panel with fixed non-modal complementary inspector; no backdrop, inertness, focus trap or layout resize.
- Removed website `DevAdOverlay` and its runtime mascot import/CSS. Preserved approved chibi source under `docs/design-reference/` for Prompt 3.
- Added `GamePresentationBroker`, renderer handshake, request payload, lifecycle validation, cancel/unavailable/timeout results and session event visibility.
- MockAdapter still owns deterministic logical outcome selection but delegates visual execution to the registered game renderer.
- Kept protocol `odesos-ads` version 1 because additions are backward-compatible. Existing games remain valid non-renderer clients.
- Startup remains supported and manually testable but fresh default is OFF. DEV configuration moves to `odesos.dev.ads.v1.1`; legacy compatible tuning migrates with startup forced OFF.
- Preserved approved interstitial/reward/banner/cooldown/concurrency laws and production Null boundary.
- Added optional validated `runId` requests and placement `maxPerRun` enforcement so later game integrations can apply generic run caps without transferring gameplay meaning to the website.
- Formalized pause/input/audio/resume and Prompt 3 Orbit handoff in `docs/ads-blueprint.md`.

## Future-provider caveat

Game-side presentation is the MOCK target, not a promise about real SDK rendering. A future real provider may render its own overlay while the game still honors lifecycle pause/audio messages.

## Scope boundaries

No Orbit/Reactor gameplay or renderer was added. No real provider, tracking, analytics, CMP/consent, legal policy, publisher identifier or deployment. Banner remains website-owned.

## Validation

- `npm.cmd run check` — PASS.
- `npm.cmd run test:ads` — PASS, 40/40.
- `npm.cmd run test:portal` — PASS, 4/4.
- `npm.cmd run test:orbit` — PASS, 11/11.
- `npm.cmd run test:reactor` — PASS, 15/15.
- Total automated tests — PASS, 70/70.
- `npm.cmd run build` — PASS. Production portal bundle: JS 41.35 kB (12.55 kB gzip), CSS 21.56 kB (5.76 kB gzip). Existing Phaser chunk-size warnings remain.
- `npm.cmd run verify:ads-production` — PASS, 32 artifacts; Null provider present and DEV/mock UI/config absent.
- `npm.cmd run verify:pages` — PASS after a narrowly elevated retry because the sandbox blocked its temporary localhost port. Both public routes/assets and all three preserved hidden builds passed.
- Desktop browser QA — PASS: the panel remained open while Home and an Orbit iframe control were clickable outside it; opening the panel did not change the iframe rectangle or create horizontal overflow.
- Renderer-unavailable QA — PASS: startup/interstitial/rewarded tests settled unavailable with `game-presentation-unavailable`, no website fullscreen overlay, and no reward qualification. Eligibility alone displayed nothing.
- Banner QA — PASS: the mock banner appeared in the website slot below the player actions, outside the iframe, and could be hidden.
- 360 × 800 QA — PASS: fixed bottom-sheet bounds were 328.67 × 736 at x=8/y=56; document scroll width was 345 for a 360px viewport. Escape closed it.
- Production preview QA — PASS: no panel trigger, shortcut response, mock overlay/text, or visible banner; Orbit started and scored, Reactor initialized.
- Console note — the browser harness continued to report the pre-existing source-less `MutationObserver.observe` error. It is not attributed to this patch and the console is therefore not claimed clean.

Human-required: physical Android/iPhone touch and audio lifecycle, reduced-motion visual review inside the future game renderer, assistive-technology review, and subjective presentation approval.

Branch: `codex/odesos-ads-v1-1-boundary-fix`. Base: `main`. NOT MERGED.
