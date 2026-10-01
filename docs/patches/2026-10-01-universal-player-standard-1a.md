# Universal game player / window standard — Step 1A

## Problem

The portal host previously made game-specific layout decisions. It switched to a
special `is-flow-game` class by slug, used Orbit Break-only short-landscape CSS,
and measured same-origin iframe `scrollHeight` with a `ResizeObserver`. Those
decisions made the host responsible for game internals and were difficult to
extend safely to a new game.

## Standard introduced

- The catalog now declares a small player layout policy for every game.
- The portal host gives an embed a responsive rectangle, a load timeout with
  retry, and a single fullscreen action.
- The iframe `load` event is the generic same-origin readiness condition; no
  game bridge, message API, analytics, advertising, or shared game state was
  added.
- Control instructions remain page content above the player, rather than player
  toolbar UI. The toolbar now contains only Fullscreen.
- The game runtime owns its canvas, layout, input, audio, storage, and any
  game-specific responsive behavior.

## Changed files

- `src/games/catalog.mjs` — replaces host-facing `viewport` values with the
  declarative `player.layout` policy.
- `src/main.ts` — removes slug-based player rendering, settings/help dialogs,
  and iframe-document sizing; keeps generic load, error/retry, fullscreen, and
  listener cleanup.
- `src/styles.css` — removes the legacy flow and Orbit Break-specific layout
  rules and uses one responsive host rectangle, with a declarative portrait
  presentation option.

## Removed or replaced

- Removed `game.slug` sizing and presentation branches.
- Removed `scrollHeight` reads and `ResizeObserver` access to iframe documents.
- Removed per-game mobile minimum heights and short-landscape Orbit Break CSS.
- Removed toolbar Settings and How to play actions and their dialog UI.
- Replaced those rules with `player.layout` catalog data and generic responsive
  player/fullscreen CSS.

## Temporary compatibility debt

Reactor Stack is deliberately unchanged. Its own Phaser runtime still uses a
fixed portrait-oriented canvas, so a narrow or short viewport can leave the
game to handle overflow inside its iframe. That is game-side responsive work,
not a portal-host sizing exception, and is deferred to a later game update.

## Validation

- `npm.cmd run check` — passed, including all five game source checks.
- `npm.cmd run build` — passed, including all five game builds and the portal
  production build. Existing Phaser chunk-size warnings remain advisory.
- `npm.cmd run verify:pages` — passed: public direct pages and embeds remain
  valid, while the three on-hold games retain verified source/embed builds.
- Static checks confirmed no remaining host references to `is-flow-game`,
  `data-flow`, `scrollHeight`, `ResizeObserver`, or player help/settings UI.

## Human resize QA still required

Check Orbit Break and Reactor Stack at 390×844 and 844×390, then use repeated
desktop resize and browser fullscreen entry/exit. Confirm that the portal
chrome remains usable, the iframe stays a valid rectangle, no controls are
obscured, and each game keeps ownership of its own responsive behavior.

## Risks and next step

This is a host-boundary cleanup, not a production-readiness guarantee. Browser
fullscreen permissions, physical touch devices, audio, and subjective visual
review still need human testing. Step 1B can add a deliberately designed
cross-origin-safe readiness protocol only if a future external embed needs one.
