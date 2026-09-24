## Summary

- Adds the first local Studio Arcade portal slice: homepage → Orbit Break card → `/games/orbit-break` → playable embedded game.
- Provides responsive light and dark themes, keyboard/touch-friendly navigation, loading/error treatment, and a configuration-driven game catalog.
- Keeps the original Orbit Break repository unchanged while including an unchanged gameplay-source snapshot under `games/orbit-break` so clean portal checkouts build independently.

## Orbit Break integration

The portal builds `games/orbit-break` with Vite base `/games/orbit-break/embed/` and serves it from `/games/orbit-break/embed/index.html` inside a same-origin iframe. Phaser input, audio, and browser-local best-score storage remain isolated from the portal shell. Generated game output under `public/games/` and the final portal `dist/` directory are ignored.

## Windows commands

```powershell
npm.cmd install
npm.cmd run check
npm.cmd run build
npm.cmd run preview
```

Vite Preview normally serves the production build at <http://127.0.0.1:4173/>.

## Validation

- `npm.cmd run check` — passed for the portal and vendored Orbit Break TypeScript.
- `npm.cmd run build` — passed for the nested-base game build and portal production build.
- Fresh temporary checkout simulation: `npm.cmd ci`, check, and build all passed without the separate original game directory.
- Homepage, `/games/orbit-break`, iframe document, and generated JavaScript/CSS assets returned successfully in local production preview.
- Desktop and narrow mobile layouts were reviewed.
- Start, reverse, collision/game over, restart, and browser-local best score were exercised.

## Manual review still needed

- Physical Android and iPhone touch behavior.
- Sound output and game feel on target devices.
- Final visual review by the project owner.

## Known limitation

Final studio branding and key art are pending; the current Orbit Break-inspired treatment is intentionally procedural.

## Scope statement

This prototype has no real accounts, ads, payments, cloud saves, analytics, leaderboards, backend, or public deployment. This PR is intentionally Draft and must not be merged as part of this task.
