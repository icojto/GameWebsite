# Studio Arcade portal prototype

A lightweight local portal for first-party browser games. The first complete path is:

`Homepage → Orbit Break card → /games/orbit-break → embedded playable game`

The repository includes an unchanged integration snapshot of Orbit Break under `games/orbit-break`. The build compiles that snapshot into the ignored `public/games/` directory, then Vite includes it in the portal's production output. A clean checkout does not need the separate original game repository.

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

Open the URL printed by Vite Preview, normally <http://127.0.0.1:4173/>. Verify both `/` and `/games/orbit-break`.

## How the game integration works

- `src/games/catalog.mjs` is the single catalog for homepage cards, game routes, iframe locations, and repository-local source locations.
- `games/orbit-break` is an unchanged gameplay-source snapshot from the original Orbit Break repository at commit `751f772fb18cfb59bd623fa5d3c262e915b0f8ca`.
- `scripts/build-games.mjs` uses the portal's installed Vite and Phaser packages and writes only into the ignored `public/games/` directory.
- Orbit Break is built with base `/games/orbit-break/embed/` and loaded from `/games/orbit-break/embed/index.html`, so its generated JavaScript and CSS resolve correctly under the nested path.
- The iframe keeps Phaser input and audio isolated from portal navigation. The game keeps its existing browser-local best score behavior.

The current abstract Orbit Break treatment is intentionally procedural. Final studio key art and branding are still pending.

## Add Game 002

1. Add an integration-ready source snapshot under `games/<slug>` with an `index.html`, `tsconfig.json`, and `src` directory.
2. Add one public entry to `gameCatalog` in `src/games/catalog.mjs`. Give it a unique `slug`, `route`, `embedBase`, and `embedPath`. Use `artVariant: 'title'` until approved art is available.
3. Add the matching repository-local source directory to `gameBuilds` in the same file, keyed by the same slug.
4. Add any new runtime packages to the root `package.json` and run `npm.cmd install`.
5. Run `npm.cmd run check`, `npm.cmd run build`, and `npm.cmd run preview`.
6. Test the generated card, route, iframe, controls, sound, and mobile sizing.

No homepage template change is needed: catalog entries automatically create cards and routes.
