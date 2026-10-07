# OdesosGames portal

A lightweight portal for first-party browser games. Orbit Break and Reactor Stack are public. Last Relay, Station Quartermaster, and Signal Below are preserved in the repository but hidden/on hold; they have no public portal pages or catalogue cards.

`Homepage → Orbit Break card → /games/orbit-break → embedded playable game`

The repository includes portal-owned Orbit Break v2 source under `games/orbit-break`. The build compiles it into the ignored `public/games/` directory, then Vite includes it in the portal's production output. A clean checkout does not need the separate original game repository.

Games 002-005 are also integrated from repository-local snapshots: Reactor Stack (`games/reactor-stack`), Last Relay (`games/last-relay`), Station Quartermaster (`games/station-quartermaster`), and Signal Below (`games/signal-below`). Each is built from its real game source and required authored assets. The original game repositories remain unchanged.

## Requirements

- Node.js 22.13 or newer
- npm

## Install and run on Windows

```powershell
git clone https://github.com/icojto/GameWebsite.git
cd GameWebsite
npm.cmd ci
npm.cmd run dev
```

Open the local URL printed by Vite, normally <http://127.0.0.1:5173/>. The dev command rebuilds the embedded game first.

## Check and preview the production build

```powershell
cd GameWebsite
npm.cmd run check
npm.cmd run test:portal
npm.cmd run test:ads
npm.cmd run test:orbit
npm.cmd run test:reactor
npm.cmd run build
npm.cmd run verify:static-release
npm.cmd run preview
```

Open the URL printed by Vite Preview, normally <http://127.0.0.1:4173/>. Verify `/`, `/games/orbit-break/`, `/games/reactor-stack/`, `/about/`, and `/contact/`. Unknown paths have a branded static `404.html` for static hosting. Games 003–005 remain hidden from public routing.

## How the game integration works

- `src/games/catalog.mjs` is the single catalog for homepage cards, game routes, iframe locations, and repository-local source locations.
- `games/orbit-break` began as a gameplay-source snapshot from the original Orbit Break repository at commit `751f772fb18cfb59bd623fa5d3c262e915b0f8ca`; v2 is maintained in this portal repository.
- `scripts/build-games.mjs` uses the portal's installed Vite and Phaser packages and writes only into the ignored `public/games/` directory.
- Orbit Break is built with base `/games/orbit-break/embed/` and loaded from `/games/orbit-break/embed/index.html`, so its generated JavaScript and CSS resolve correctly under the nested path.
- The iframe keeps Phaser input and audio isolated from portal navigation. The game migrates the browser-local legacy best score into a versioned local profile with quests, XP, Stars, scores, and cosmetic equipment.

All game builds use the same isolation pattern: the homepage creates cards only, while a public game's iframe is created only when its dedicated page opens. Each embed has its own nested Vite base at `/games/<slug>/embed/`, preserving independent styles, input, audio, and browser-local storage. On-hold game embed builds remain in the output for preservation/testing, but the portal does not link to or route to them; hiding is not an access-control mechanism.

The current abstract Orbit Break treatment is intentionally procedural. Final studio key art and branding are still pending.

## Add Game 006

1. Copy the real game's integration-ready source under `games/<slug>` with an `index.html`, `tsconfig.json`, `src`, and any required `public` or `scripts` directories. Do not copy `node_modules`, `dist`, or `.git`.
2. Add one entry to `gameCatalog` in `src/games/catalog.mjs`. Give it a unique `slug`, `route`, `embedBase`, and `embedPath`. Set `visibility: 'public'` only after approval; use `artVariant: 'title'` until approved art is available.
3. Add the matching repository-local source directory to `gameBuilds` in the same file, keyed by the same slug.
4. Add any required packages to the root `package.json` and run `npm.cmd install`; portal scripts intentionally use only the root dependency installation.
5. Run `npm.cmd run check`, `npm.cmd run test:portal`, `npm.cmd run build`, `npm.cmd run verify:static-release`, and `npm.cmd run preview`.
6. Test the generated card, route, iframe, controls, sound, and mobile sizing.

No homepage template change is needed: catalog entries automatically create cards and routes.

## Cloudflare Workers static hosting

Website 0.2.0 targets an asset-only Cloudflare Worker named gamewebsite with Git integration. GitHub retains source control, PR review and CI; Workers Builds compiles the static site with npm run build and Wrangler serves ./dist. The existing live GitHub Pages origin remains until a later human-approved cutover.

Seven real static routes cover Home, both public games, About, Contact, Privacy and Terms. Root 404.html supplies genuine 404 responses; directory index pages use trailing slashes. This is not an SPA fallback. Existing game embeds, robots and sitemap are preserved.

Run npm run verify:static-release after building for the provider-neutral metadata/assets/404 checks. Run npm run cf:check for a non-deploying Wrangler dry-run; npm run cf:dev starts local Workers static emulation. Existing preview and qa:preview remain the Vite production-preview commands. Wrangler 4.148.0 is an exact development-only dependency; it is not part of the browser bundle. Temporary Wrangler output is ignored. For local checks, WRANGLER_SEND_METRICS=false disables Wrangler CLI usage metrics; this is distinct from visitor analytics, which remains absent.

The workflow .github/workflows/static-release.yml runs required tests, build, static-release verification and Wrangler dry-run on PRs and main, uploading dist without deploying. Main remains the future production branch. The Gate 2 feature branch must first have an isolated Cloudflare Preview; do not merge merely to obtain a preview.

See [Workers static handoff](docs/release/cloudflare-workers-static.md). Public contact/legal pages and scoped saved-data controls are implemented. Production uses Null ads; no CMP, ad SDK, analytics, accounts or backend is active.

## Mock-only monetization blueprint

The shared website ad service has no real provider. Orbit and Reactor connect to the host policy through their game-side presentation/lifecycle clients in DEV. Production always uses the unavailable Null adapter: no ad panel, mock overlays, courtesy screen or mock banners. The production build runs an artifact guard automatically; rerun it with `npm.cmd run verify:ads-production`.

For isolated local mock QA, run `npm.cmd run qa:dev` and open its exact session URL. Use **AD DEV** / Ctrl+Shift+A for the non-modal website inspector and **Open Game DEV** / Ctrl+Shift+D inside the game. Fullscreen mock/courtesy visuals belong to the active game-side GameAdPlayer. Startup support defaults OFF. Tuning persists within the selected storage scope; statistics are page-session only. `npm.cmd run qa:preview` builds actual production with Null and no DEV controls. Both launchers use strict ports and report browser verification separately.

See [QA contract 0.4.1](docs/qa-contract-0.4.1.md), [targeted patch handoff](docs/patches/2026-10-06-qa-closure-0.4.1.md), [architecture](docs/ads-blueprint.md), and [human QA checklist](docs/ads-qa.md). PROVIDER COMPLIANCE NOT YET REVIEWED.
