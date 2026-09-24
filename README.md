# Studio Arcade portal prototype

A lightweight local portal for first-party browser games. The portal now contains five complete game paths.

`Homepage → Orbit Break card → /games/orbit-break → embedded playable game`

The repository includes an unchanged integration snapshot of Orbit Break under `games/orbit-break`. The build compiles that snapshot into the ignored `public/games/` directory, then Vite includes it in the portal's production output. A clean checkout does not need the separate original game repository.

Games 002-005 are also integrated from repository-local snapshots: Reactor Stack (`games/reactor-stack`), Last Relay (`games/last-relay`), Station Quartermaster (`games/station-quartermaster`), and Signal Below (`games/signal-below`). Each is built from its real game source and required authored assets. The original game repositories remain unchanged.

## Requirements

- Node.js 22.13 or newer
- npm

## Install and run on Windows

```powershell
git clone <private-repository-url>
cd GameWebsite
npm.cmd install
npm.cmd run dev
```

Open the local URL printed by Vite, normally <http://127.0.0.1:5173/>. The dev command rebuilds the embedded game first.

## Check and preview the production build

```powershell
cd GameWebsite
npm.cmd run check
npm.cmd run build
npm.cmd run preview
```

Open the URL printed by Vite Preview, normally <http://127.0.0.1:4173/>. Verify `/` and `/games/orbit-break`, `/games/reactor-stack`, `/games/last-relay`, `/games/station-quartermaster`, and `/games/signal-below`.

## How the game integration works

- `src/games/catalog.mjs` is the single catalog for homepage cards, game routes, iframe locations, and repository-local source locations.
- `games/orbit-break` is an unchanged gameplay-source snapshot from the original Orbit Break repository at commit `751f772fb18cfb59bd623fa5d3c262e915b0f8ca`.
- `scripts/build-games.mjs` uses the portal's installed Vite and Phaser packages and writes only into the ignored `public/games/` directory.
- Orbit Break is built with base `/games/orbit-break/embed/` and loaded from `/games/orbit-break/embed/index.html`, so its generated JavaScript and CSS resolve correctly under the nested path.
- The iframe keeps Phaser input and audio isolated from portal navigation. The game keeps its existing browser-local best score behavior.

All five games use the same isolation pattern: the homepage creates cards only, while a game iframe is created only when its dedicated page opens. Each embed has its own nested Vite base at `/games/<slug>/embed/`, preserving independent styles, input, audio, and browser-local storage.

The current abstract Orbit Break treatment is intentionally procedural. Final studio key art and branding are still pending.

## Add Game 006

1. Copy the real game's integration-ready source under `games/<slug>` with an `index.html`, `tsconfig.json`, `src`, and any required `public` or `scripts` directories. Do not copy `node_modules`, `dist`, or `.git`.
2. Add one public entry to `gameCatalog` in `src/games/catalog.mjs`. Give it a unique `slug`, `route`, `embedBase`, and `embedPath`. Use `artVariant: 'title'` until approved art is available.
3. Add the matching repository-local source directory to `gameBuilds` in the same file, keyed by the same slug.
4. Add any required packages to the root `package.json` and run `npm.cmd install`; portal scripts intentionally use only the root dependency installation.
5. Run `npm.cmd run check`, `npm.cmd run build`, and `npm.cmd run preview`.
6. Test the generated card, route, iframe, controls, sound, and mobile sizing.

No homepage template change is needed: catalog entries automatically create cards and routes.

## GitHub Pages preparation

The project site is configured for `https://icojto.github.io/GameWebsite/`. The Pages build uses `/GameWebsite/` as Vite's base and builds each game embed under `/GameWebsite/games/<slug>/embed/`. Static `index.html` files are generated for all five game routes, so a game page can be opened directly or refreshed.

To reproduce the Pages artifact locally on Windows:

```powershell
cd GameWebsite
npm.cmd ci
npm.cmd run check
$env:GITHUB_PAGES = 'true'
npm.cmd run build
npm.cmd run verify:pages
Remove-Item Env:GITHUB_PAGES
```

The verifier serves `dist` locally under `/GameWebsite/` and checks the homepage, every direct game page and embed, linked JavaScript/CSS assets, and Signal Below's SVG scene. It does not publish anything.

The workflow at `.github/workflows/pages.yml` runs only for pushes to `main`; it installs with `npm ci`, checks, builds, verifies, uploads `dist`, and deploys to the `github-pages` environment. To publish, review and merge the Pages Draft PR into `main`, then confirm the **Deploy GitHub Pages** workflow succeeds in the Actions tab and open the site URL above. GitHub currently reports Pages source as **GitHub Actions**. The repository and Pages site are currently public; verify that publication is intended before merging.
