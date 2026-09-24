# GitHub Pages preparation — 2026-09-24

## Changes

- Added a `main`-only GitHub Actions workflow that runs `npm ci`, `npm run check`, a Pages production build, local Pages-path verification, artifact upload, and Pages deployment.
- Configured the portal Vite base as `/GameWebsite/` when `GITHUB_PAGES=true`; local development keeps `/`.
- Built all five game embeds with the same repository prefix and kept their output under their isolated `games/<slug>/embed/` paths.
- Made portal links, iframe locations, and route matching use the active Vite base.
- Added real static entry files for direct game URLs, since GitHub Pages has no Vite SPA fallback.
- Added a local static-server verifier for the Pages path.

## Validation

- `npm.cmd ci`: passed from the portal lockfile (21 packages, 0 reported vulnerabilities).
- `npm.cmd run check`: passed for portal and all five game sources.
- `GITHUB_PAGES=true npm.cmd run build`: passed for the portal and all five game embeds. Vite emitted advisory warnings for Phaser-sized chunks.
- `npm.cmd run verify:pages`: passed for homepage, all five direct game pages, all five embeds and linked nested assets, and Signal Below's SVG scene asset.

No feature-branch deployment was run. The Pages endpoint itself was not changed in this task. A browser interaction pass and physical Android/iPhone checks remain for publication review.
