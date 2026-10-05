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
npm.cmd run verify:pages
npm.cmd run preview
```

Open the URL printed by Vite Preview, normally <http://127.0.0.1:4173/>. Verify `/`, `/games/orbit-break/`, `/games/reactor-stack/`, `/about/`, and `/contact/`. Unknown paths have a branded static `404.html` for GitHub Pages. Games 003–005 remain hidden from public routing.

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
5. Run `npm.cmd run check`, `npm.cmd run test:portal`, `npm.cmd run build`, `npm.cmd run verify:pages`, and `npm.cmd run preview`.
6. Test the generated card, route, iframe, controls, sound, and mobile sizing.

No homepage template change is needed: catalog entries automatically create cards and routes.

## GitHub Pages preparation

The project site is configured for <https://odesosgames.com/>. The Pages build uses `/` as Vite's base and builds each game embed under `/games/<slug>/embed/`. Static HTML with route-specific title, description, canonical, social metadata, and structured data is generated for the homepage, both public games, About, and Contact. A sitemap and robots file list only those public routes. The old `https://icojto.github.io/GameWebsite/` URL redirects to the custom domain; it is not a second deployment path.

To reproduce the Pages artifact locally on Windows:

```powershell
cd GameWebsite
npm.cmd ci
npm.cmd run check
npm.cmd run test:portal
npm.cmd run build
npm.cmd run verify:pages
```

The verifier serves `dist` locally from `/` and checks public routes and embeds, metadata, social image, sitemap, robots, 404, linked assets, preserved on-hold embeds, and Signal Below's SVG scenes. It rejects stale `/GameWebsite/` links and does not publish anything. The native portal tests cover catalogue visibility and safe storage behavior.

The workflow at `.github/workflows/pages.yml` runs only for pushes to `main`; it installs with `npm ci`, checks, tests, builds, verifies, uploads `dist`, and deploys to the `github-pages` environment. GitHub Pages must remain configured with **GitHub Actions** as its source and `odesosgames.com` as its custom domain in repository Settings → Pages. For a workflow-published site, GitHub ignores a repository `CNAME` file; the Pages setting is authoritative. To publish a fix, review and merge its PR into `main`, confirm the **Deploy GitHub Pages** workflow succeeds in the Actions tab, and open the site URL above. The repository and Pages site are currently public; verify that publication is intended before merging.

The Contact page does not publish a contact address because no approved public channel is in this repository. A human must supply one before a later compliance submission. No legal policies, consent system, ads, accounts, analytics, or backend are implemented by this website pass. See [website release checklist](docs/website-release-checklist.md) for the human QA gate.

## Mock-only monetization blueprint

The shared website ad service has no real provider and neither game is connected to presentation yet. Production always uses the unavailable Null adapter: no ad panel, mock overlays, courtesy screen or mock banners. The production build runs an artifact guard automatically; rerun it with `npm.cmd run verify:ads-production`.

For local mock QA, run `npm.cmd run dev`, open `/games/orbit-break/` or `/games/reactor-stack/`, and press **Ctrl+Shift+A** (or use **AD DEV**). The website-level panel is a non-modal inspector outside the iframe; the uncovered website and game remain interactive. Fullscreen mock/courtesy visuals belong to a future game-side GameAdPlayer, so current tests report `game-presentation-unavailable` without covering the page. Startup support defaults OFF. Tuning persists locally, while statistics are only for this page session. `npm.cmd run preview` is production behavior and deliberately has no Ad Dev Panel.

See [v1.1 architecture, GameAdPlayer contract and Prompt 3 handoff](docs/ads-blueprint.md), [precise human QA checklist](docs/ads-qa.md), and [boundary-fix patch log](docs/patches/2026-10-05-odesos-ads-v1-1-boundary-fix.md). PROVIDER COMPLIANCE NOT YET REVIEWED. Orbit monetization is deferred to Prompt 3; Reactor monetization to Prompt 4.
