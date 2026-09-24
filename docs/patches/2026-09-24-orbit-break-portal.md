# Orbit Break portal prototype — 2026-09-24

## Decision summary

- Used a small vanilla TypeScript/Vite portal to keep the first-party game shell fast and maintainable.
- Kept Orbit Break isolated in a same-origin iframe at `/games/orbit-break/embed/index.html`.
- Rebuilt the game with base `/games/orbit-break/embed/`; its original root-relative production build was not safe to embed at a nested path.
- Left the original Orbit Break repository unchanged. An exact gameplay-source snapshot at commit `751f772fb18cfb59bd623fa5d3c262e915b0f8ca` now lives under `games/orbit-break`, making a clean portal checkout self-contained.
- Generated embed output lives under the portal's ignored `public/games/` directory.
- Used the game's cyan, magenta, dark-space visual language inside an approachable light/dark portal frame.
- Used procedural artwork because no approved portal key art was supplied. Final studio art and branding remain pending.

## Files changed

- Portal application: `index.html`, `src/main.ts`, `src/styles.css`, `src/vite-env.d.ts`
- Catalog and game source mapping: `src/games/catalog.mjs`, `games/orbit-break`
- Repeatable game checks/builds: `scripts/check-games.mjs`, `scripts/build-games.mjs`
- Project setup: `package.json`, `package-lock.json`, `tsconfig.json`, `.gitignore`
- Handoff: `README.md`, `public/favicon.svg`, this patch log

## Validation

- Portal TypeScript check
- Orbit Break TypeScript check against its unchanged source
- Fresh temporary checkout install, check, and build using repository-local game source only
- Portal production build, including a nested-base Orbit Break build
- Local production preview of homepage, `/games/orbit-break`, iframe document, and generated game assets
- Desktop and narrow mobile viewport review
- Automated interaction where available: start, reverse, collision/game over, and restart

## Limitations

- Physical iOS and Android touch testing remains manual.
- Browser audio still requires the first player gesture, by design.
- Phaser is intentionally shipped as one large game chunk; the portal shell remains small and the game is loaded only on its dedicated route.
- Approved studio branding and final key art are pending.

## Next integration step

Add Game 002 as a new catalog entry plus build-source mapping, then validate its own nested Vite base and iframe controls before approving its art.
