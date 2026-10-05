# Odesos universal monetization blueprint v1

Requested patch date: 2026-10-04. Implementation/QA completed: 2026-10-05. MOCK ONLY. Draft review; HUMAN MERGE ONLY.

## Pre-flight

- Repository: `icojto/GameWebsite`; main baseline `cb33dbb62a73c52e973db77f08503409f91b437c`, refreshed and unchanged before PR creation.
- Website production-readiness PR #14 was merged into main at 2026-10-04T16:07:08Z. Main includes Reactor revamp #13, current production Orbit #12 and Player V2 #11. The mandatory stale-main stop condition does not apply.
- Branch created from current main: `codex/odesos-monetization-blueprint-v1`.
- Only Orbit Break and Reactor Stack are public. Games 003–005 remain hidden with source and builds intact. No files under `games/` were edited; separate original projects were untouched.
- A pre-existing package-lock working-tree stat marker has no content difference (working/index Git blob `6154c964b04ed14b3c7cb4ff642bc14df52183cc`). It was not staged or rewritten. No dependency was added.

## Architecture and boundaries

Website `AdService` owns typed placements, provider access, active-time eligibility, concurrency, startup state, cooldowns/caps, local observations, event bus and bridge responses. The provider interface is small: initialize/readiness/prepare/show/banner/teardown. Production uses Null only; DEV dynamically imports the deterministic Mock adapter, panel, courtesy and overlay graph.

Startup defaults to one attempted request/session. Interstitial time creates eligibility only; registered semantic safe events trigger evaluation. Defaults are 180 seconds first/interval/cooldown, three shown/session. Active time excludes unknown/menu/paused/game-over/background and active-ad time. Rewarded requires explicit opt-in; only shown + completed qualifies, with no actual game reward applied. Shown rewarded ads reset interstitial cooldown by default. One fullscreen request at a time; a 30-second deadline and cancellation settle provider hangs.

The version-1 exact-origin/current-frame bridge validates payload shape, types, IDs, game and placement ownership. It supports readiness, state, semantic events, requests, lifecycle responses and single-use reward acknowledgments. Route/frame changes dispose bindings and cancel active work. No game reads parent DOM and no game-specific monetization is connected yet.

The primary banner slot is website-owned, below the action bar and above information. Mock banners are explicit and responsive; production collapses the slot. Courtesy appears only after provider readiness, defaults to 1,000 ms, has neutral per-type presets and an original lightweight chibi SVG. It honors reduced motion and never precedes no-fill/load failure.

ODESOS AD DEV is a website modal drawer/bottom sheet with eight sections, generic simulation, one-shot outcomes, tuning, state, bounded event history and session statistics. Only normalized tuning persists in `odesos.dev.ads.v1` via the safe storage helper; no global/historical analytics are implied. Native dialogs control focus and inertness; Escape never grants a reward. Ctrl+Shift+A is separate from game Ctrl+Shift+D. There is no general Website Dev Panel or Admin Panel.

## Production protection

Only the Null service graph survives the Vite production DEV branch elimination. No runtime URL, storage preference or keyboard shortcut imports Mock. The build fails if any scanned output includes panel/mock/courtesy development signatures; it also asserts Null is present. All current game/copied assets are included in the scan. CI runs the new and existing tests before the existing **main-only** deployment job. This branch is neither merged nor deployed.

Browser QA additionally found an existing dev-server route/source-directory collision. `vite.config.mjs` now rewrites exact catalog page paths to the portal entry in dev only, leaving every nested embed/asset path unchanged. This also prevents hidden game source entry pages from replacing portal not-found pages in dev.

## Files and purpose

| File | Purpose |
| --- | --- |
| `src/ads/model.ts` | Domain/config/provider contracts, defaults, normalization, primary banner registry and counters |
| `src/ads/service.ts` | Eligibility, request lifecycle, safety, placements, statistics, events, banners |
| `src/ads/null-adapter.ts` | Production unavailable provider without UI |
| `src/ads/bridge.ts` | Versioned validated iframe protocol and lifecycle |
| `src/ads/runtime.ts` | Portal route/frame/visibility wiring and compile-time DEV boundary |
| `src/ads/dev/mock-adapter.ts` | Deterministic one-shot mock outcomes and website banner |
| `src/ads/dev/overlay.ts` | Accessible courtesy/mock dialogs, countdown and cancellation |
| `src/ads/dev/panel.ts` | Website-only controls, simulation, config persistence and observations |
| `src/ads/dev/styles.css` | Drawer/sheet/banner/overlay styling and reduced motion |
| `src/ads/dev/mascot.svg` | Original DEV-only chibi artwork |
| `public/ads/ad-badge.svg` | Original reusable provider-neutral ad badge |
| `src/main.ts` | Runtime creation/binding and one hidden website banner slot |
| `vite.config.mjs` | Exact dev game-page routing fix; production base remains `/` |
| `tsconfig.json` | TypeScript-extension imports for native no-emit test-compatible modules |
| `package.json` | Ad/Reactor tests and mandatory production artifact guard |
| `.github/workflows/pages.yml` | Run ad/Orbit/Reactor tests before existing main-only build/deploy |
| `scripts/verify-ads-production.mjs` | Reject development ad UI/config in finished production output |
| `tests/ads.test.mjs` | Native deterministic service, bridge, Null, clock and safety tests |
| `README.md` | Windows test/dev entry points and production separation |
| `docs/ads-blueprint.md` | Architecture, protocol, ownership, defaults, badge and deferred scope |
| `docs/ads-qa.md` | Precise dev/production/device QA checklist and observed evidence |
| This patch log | Change record, tests, limits and human handoff |

## Validation

- `npm.cmd run check` — PASS, portal plus all five game TypeScript checks.
- `npm.cmd run test:ads` — PASS, 33 native tests (including a source-structure banner ownership check).
- `npm.cmd run test:portal` — PASS, 4 tests (public/hidden catalog and safe storage included).
- `npm.cmd run test:orbit` — PASS, 11 tests.
- `npm.cmd run test:reactor` — PASS, 15 tests.
- `npm.cmd run build` — PASS; all five embeds and portal built; production boundary passes across 32 output artifacts.
- `npm.cmd run verify:ads-production` — PASS; Null present, mock/panel/courtesy/config signatures absent.
- `npm.cmd run verify:pages` — PASS, public routes/embeds/assets/SEO/404 and preserved hidden builds. First sandboxed attempt was denied localhost access (`EACCES`); rerun with local network permission passed.
- `git diff --check` — PASS. Existing Node type-transform experimental warnings and Phaser large-chunk warnings remain.

Browser evidence and remaining human checks are recorded in [ads-qa.md](../ads-qa.md). Core flows, 360px layout, production absence, Orbit startup and a Reactor move were exercised. Console is **not certified clean**: the in-app browser logs a source-less MutationObserver error whose attribution remains unresolved. Physical Android/iPhone touch/audio, OS reduced-motion behavior, exhaustive fullscreen/background/assistive-technology checks and long-session soak require human QA.

## Performance and limitations

No dependency added. Main's portal JS was 22.23 kB / 6.87 kB gzip; this patch is approximately 36.9 kB / 11.5 kB gzip (about +4.6 kB gzip). Portal CSS remains 21.56 kB / 5.76 kB gzip. Dev panel/CSS/mascot are absent from production; the tiny badge is the only new public art. No game bundles changed. A single lightweight host clock updates twice/second; production does not create ad UI. No frame-rate/physical-device performance claim is made.

No real provider, revenue/traffic analytics, accounts, advertising tracking or cookies, consent/CMP/TCF, privacy/terms/cookie policy, ads.txt, API key or publisher ID. No provider compliance claim: **PROVIDER COMPLIANCE NOT YET REVIEWED**. No Google/other SDK, Google H5 Games Ads or AdSense. No gameplay pausing/rewards from ads yet; DEV simulates the contract only.

Orbit monetization integration → Prompt 3. Reactor monetization integration → Prompt 4.

Base: `main`. Head: `codex/odesos-monetization-blueprint-v1`. One Draft PR. **NOT MERGED. NOT DEPLOYED.**
