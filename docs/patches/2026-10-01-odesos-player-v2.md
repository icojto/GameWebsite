# Odesos Player V2 + Game Viewport Contract v1

## Problem and old behavior

The game page used a large pre-game information block and a player toolbar above
the iframe. Reactor Stack was a tall document inside its iframe: short screens
could require internal scrolling, while the host had little space for the game.

## Viewport contract

The portal owns one responsive player rectangle. Its wide stage uses each
catalogue record's accent colors for a restrained backdrop, while a portrait
game keeps a centered portrait content rectangle rather than stretching across
the stage. The iframe always fills that content rectangle. Games own the UI,
canvas, input, audio, storage, and reflow within the rectangle; they do not ask
the host for additional document height.

Orbit Break declares `orientation: any`; Reactor Stack declares
`orientation: prefer-portrait`. Neither is blocked from landscape.

## Player and page changes

- The pre-game back link, status, large heading, description, and permanent
  controls were removed from above the player.
- The player is now the page hero, followed by an action bar with local-only
  like/dislike, Controls, and Fullscreen actions.
- Controls are sourced from existing catalogue metadata and appear in an
  accessible dialog and a below-player disclosure.
- Useful known information is below the player. No dates, developer, engine,
  account, advertising, or server-backed rating data was invented.
- The fullscreen target is the player shell, retaining an exit control and
  avoiding unrelated page content.

## Reactor Stack responsive pass

Reactor's runtime was not recreated and its rules, board state, scoring, heat,
storage, input, and audio behavior were not changed. Its embed is now a bounded
CSS grid with `html`, `body`, and `#app` constrained to the provided player
rectangle. Portrait stacks board and HUD; landscape puts the board beside the
HUD. The fixed logical 400×480 Phaser board remains `FIT`-scaled inside the
available board region, so CSS resize/reflow does not restart the game.

## Validation

- `npm.cmd run check` — passed, including both active-game checks and preserved
  on-hold game checks.
- `npm.cmd run build` — passed. Existing Phaser bundle-size warnings are
  advisory only.
- `npm.cmd run verify:pages` — passed: public routes/assets for Orbit and
  Reactor, plus preserved source/embed artifacts for Games 003–005.
- Local production preview — Orbit and Reactor direct routes loaded; controls
  dialog opened and closed; local action buttons rendered; Reactor was started
  and remained active through fullscreen entry/exit.

The repository has no Playwright or Puppeteer dependency. No browser-testing
dependency was installed for this patch, so the fixed viewport matrix remains
human visual QA rather than a claimed automated visual pass.

## Human QA required

At 1920×1080, 1366×768, 1280×720, 1024×768, 430×932, 390×844, 360×800,
932×430, 844×390, and 800×360: verify stage fit, no iframe scrollbar or
horizontal overflow, reachable action bar and controls dialog, and no clipping.
During an active Orbit run and active Reactor board, repeatedly resize/rotate,
enter/exit fullscreen, and confirm scores, board, heat, and input remain live.
Physical touch, audio, visual polish, and below-floor graceful degradation need
human review.

## Known limitations

No headless browser framework is present, so automated checks cannot prove
visual fit at every viewport. Reactor now has a responsive contained layout but
its subjective smallest-screen readability is a human approval decision. Games
003–005 were not modernized or exposed.
