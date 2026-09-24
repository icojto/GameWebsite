## Summary

Adds four real playable portal integrations:

- Game 002: Reactor Stack - drag/tap containment merge puzzle.
- Game 003: Last Relay - landscape three-lane defense.
- Game 004: Station Quartermaster - deterministic resource-management game.
- Game 005: Signal Below - atmospheric narrative sci-fi mystery.

Each game receives a catalog card and dedicated route. The homepage renders cards only; its game iframe is created only when a dedicated game page opens.

## Integration

The portal contains repository-local snapshots under `games/`, including required authored SVG assets. The root build invokes each real Vite game source with base `/games/<slug>/embed/`, writes ignored generated output beneath `public/games/`, and loads the output in a same-origin iframe. This isolates individual game styles, input, audio, and browser-local storage.

The four original GameTests repositories were not modified.

## Windows commands

```powershell
cd GameWebsite
npm.cmd install
npm.cmd run check
npm.cmd run build
npm.cmd run preview
```

Vite Preview normally serves the production build at <http://127.0.0.1:4173/>.

## Validation

- `npm.cmd run check` passed for the portal and all five game snapshots.
- `npm.cmd run build` passed for all five nested embeds plus the portal bundle. Vite emitted advisory Phaser chunk-size warnings only.
- Local production preview returned HTTP 200 for `/`, all five game routes, all iframe documents, generated nested assets, and Signal Below's authored SVG scene asset.
- Catalog integrity confirms all five routes use repository-local paths, with no `GameTests` or absolute Windows path dependency.
- Original model tests passed without source changes: Reactor Stack 15/15, Last Relay 13/13, Station Quartermaster 20/20, Signal Below 7/7.

## Manual checks still needed

- Physical Android and iPhone touch targets, orientation changes, and gameplay comfort.
- Sound behavior after a user gesture for games that include synthesized audio.
- Final desktop and narrow mobile visual review by the project owner; the local browser-automation session became unavailable before that final interaction pass could be repeated.

## Limitations and scope

Final studio branding and key art are pending; existing card visuals remain procedural. This prototype has no real accounts, ads, payments, cloud saves, analytics, leaderboards, backend, public deployment, or monetization. This PR is Draft and must not be merged as part of this task.
