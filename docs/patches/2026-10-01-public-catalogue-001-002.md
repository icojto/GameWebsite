# Public catalogue hold — Games 003–005

## Scope

Restricts the current OdesosGames public catalogue to Game 001 (Orbit Break) and Game 002 (Reactor Stack). Games 003–005 remain intact and on hold.

## Implementation

- Adds a catalogue-level `visibility` field to all five game records.
- Exports `publicGameCatalog` for portal cards, route matching, featured selection, and the visible playable-game count.
- Keeps `gameCatalog` as the complete internal build/check catalogue, so all five game sources continue to compile.
- Generates static direct game pages only for public games. Hidden game route pages therefore return 404 in a Pages-shaped static build and render the portal unavailable view during local Vite preview.
- Keeps the hidden game embed artifacts in the production output for preserved source/build validation.

## Public games

1. Orbit Break
2. Reactor Stack

## On-hold games

1. Last Relay
2. Station Quartermaster
3. Signal Below

## Validation

- `npm.cmd run check` — passed, including all five game source checks.
- `npm.cmd run build` — passed, including all five game builds. Existing Vite Phaser chunk-size warnings remain advisory only.
- `npm.cmd run verify:pages` — passed: public routes and embeds for Games 001–002, 404 direct static routes for Games 003–005, and preserved hidden embed assets.
- Browser check — homepage displayed only Games 001–002 and `2 playable games`; `/games/last-relay/` rendered the portal unavailable page.
- Confirmed all three on-hold source directories still exist.

## Caveat

This is catalogue hiding, not access control. Because static hosting still deploys the preserved embed artifacts, a person who already knows a hidden embed URL can reach it directly. No authentication or security restriction was added.
