## Summary

Prepares the five-game Vite portal for the repository's GitHub Pages URL, `https://icojto.github.io/GameWebsite/`.

## Changes

- Adds a workflow triggered only by pushes to `main`: `npm ci`, check, Pages production build, local path verification, upload of `dist`, and Pages deployment.
- Configures Vite and all five game builds for `/GameWebsite/` without changing local `/` development.
- Makes portal navigation and iframe URLs base-aware.
- Generates static entry pages for all five direct game URLs.
- Documents publication and adds a Pages-path static verifier.

## Validation

- `npm.cmd ci` — passed from the committed lockfile.
- `npm.cmd run check` — passed for portal and all five game sources.
- Pages production build — passed for portal and all five embeds; only advisory Phaser chunk-size warnings.
- `npm.cmd run verify:pages` — passed for homepage, five direct game pages, five embeds, linked JavaScript/CSS assets, and Signal Below SVG art under `/GameWebsite/`.
- Workflow has not been run; it will run only after this change reaches `main`.

## Publication and review

GitHub currently reports the repository as public and Pages source as GitHub Actions. Review this Draft PR, verify that a public site is intended, then merge it into `main` to trigger the deployment workflow. Confirm the Actions run succeeds and review the live Pages URL.

Final browser interaction and physical Android/iPhone touch, orientation, sound, and visual review remain manual. Final studio branding and key art are pending. The portal has no real accounts, ads, payments, cloud saves, backend, or monetization.
