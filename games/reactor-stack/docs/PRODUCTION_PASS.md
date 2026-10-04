# Reactor Stack production pass — 2026-10-03

## Architecture

The project began as TypeScript + Vite + Phaser 4.2.1. `rules.ts` already owned pure board state, legal actions, turn resolution, injected RNG, and a small `TurnController`; Phaser was presentation-only. That separation remains. The controller now owns an active run configuration and a distinct in-memory runtime tuning copy. Structural settings apply on restart; safe tuning settings can update the active run.

## Responsive layout and board geometry

The old fixed 5×6, 400×480, 80px grid was replaced with the 6×6 production default. `ReactorScene` derives cell size, pixel bounds, cell centers, hit testing, selection, and effects from the active `gridWidth`, `gridHeight`, and actual canvas rectangle. `ResizeObserver` resizes only the Phaser presentation. It never starts a run or mutates board, score, heat, stability, moves, RNG, selection state, or power-up charges.

`#app` fills its allocated container and uses no document gameplay scrolling. Wide containers show a compact left control panel plus a dominant board. Portrait recomposes into goal/moves above, board center, controls below. Short landscape uses a reduced left HUD. Below the supported minimum, noncritical UI is reduced before any warning is considered.

## Game systems

Move/merge/random spawn gameplay is unchanged: an occupied cell moves orthogonally into an empty cell or merges with an equal tier; accepted actions add one Move, heat, and a random low-tier spawn when possible. Invalid actions are free. Tier V moves but never merges. Simultaneous win/heat precedence remains WIN, as established by the original rules/tests.

Cool Core has one use, needs heat above zero, removes 25 heat with a zero clamp, and never changes move count, board, spawn, score, or stability. Upgrade has one use; it upgrades a selected Tier I–IV cell once and rejects Tier V without consuming its charge or changing other game reward systems. Pause, menu, and sound now live in the pause overlay. Undo was not added.

Scores are now `reactor-stack-scores`: the highest ten completed WIN/FAIL runs, ordered by score descending, moves ascending, then timestamp ascending. Each entry stores score, moves, result, and timestamp. Existing `reactor-stack-best` remains a compatible fallback and is updated from the high score. Storage exceptions stay non-fatal.

## Presentation and dev panel

Tier art is a procedural Variant 3 reactor-cell family: nested octagonal geometry grows from a simple cyan cell to a dense orange core, with separate tier labels. The minimal dark reactor UI remains; the supplied image informed board/panel hierarchy only.

Development builds load `dev-panel.ts` only behind `import.meta.env.DEV`; production contains no panel marker, fixture marker, or entry point. Ctrl+Shift+D opens a desktop drawer or narrow bottom sheet. It includes runtime, viewport, performance, board, spawning, heat, stability, score, power-up, animation, audio, storage, QA fixture, debug, manual-test, session-log, and config-action sections. Dev tuning and session logs remain memory-only. Local score clearing is scoped to Reactor Stack and requires an in-page confirmation.

## Tests and validation

`npm.cmd run check`, `npm.cmd test`, and `npm.cmd run build` pass. The 13 tests cover 6×6 initialization/coordinates, random spawn/full board behavior, move/merge rules, move counting, Tier V behavior, rewards, WIN precedence, heat/deadlock failures, both power-ups, phase locking/pause state, pointer normalization, Top 10 ordering/malformed storage/legacy score fallback, and presentation-only layout classification.

Production preview served successfully from `http://127.0.0.1:4174/`. Vite retains its non-blocking Phaser bundle-size advisory. Browser UI automation was unavailable in this session, so no screenshot-driven visual pass is claimed.

## Human QA checklist

1. Start a run at 1920×1080, 1600×900, 1440×900, 1366×768, 1024×768, 800×600.
2. Test 430×932, 390×844, 375×812, 360×800, and 320×568 portrait containers.
3. Test 932×430, 844×390, 812×375, 800×360, and 568×320 landscape containers.
4. During an active run resize wide→narrow→wide, tall→short→tall, and rotate portrait↔landscape repeatedly. Confirm no state/RNG/charge change, clipping, overflow, or pointer offset.
5. Test tap and drag moves, invalid actions, both power-ups, pause/resume/sound/restart/menu, local scores, and production build absence of the dev panel.
6. Open/close the dev drawer and narrow bottom sheet; run fixtures, debug overlays, session export, and storage controls.
7. Complete both a WIN and FAIL. Check board dominance, tier readability, typography, touch targets, no awkward whitespace, merge feel, pacing, and replay desire.

Physical touch accuracy, subjective design/balance, audio feel, long-run memory, and background-tab behavior remain human review.
