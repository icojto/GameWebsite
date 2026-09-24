# Reactor Stack — Game 002

A compact portrait-first reactor merge game built with TypeScript, Phaser, and Vite. No backend or external asset services.

## Run

Use Node 24 or newer. From this folder in PowerShell:

```powershell
npm.cmd install
npm.cmd test
npm.cmd run check
npm.cmd run build
npm.cmd run dev -- --host 127.0.0.1 --port 5174 --strictPort
```

Development: http://127.0.0.1:5174/

In another terminal, after building:

```powershell
npm.cmd run preview -- --host 127.0.0.1 --port 4174 --strictPort
```

Production preview: http://127.0.0.1:4174/. Stop each server with Ctrl+C. Ports are deliberately explicit to avoid other local games.

## Play

Drag a cell to one orthogonal neighbor, or tap the source then the destination. Move into empty space, or merge equal tiers into the next tier. Tier 5 can move but never merge. Invalid actions cost nothing. Every successful action adds a new low-tier cell if the run is still active and a slot is free.

Reach 100 stability to win. Heat reaching 100, or a board without any legal action, causes containment failure. Score and stability are independent. Best score is stored locally; the game still runs when storage is denied. Active runs are not saved. Sound is synthesized following user interaction and can be muted for the session.

## Factory defaults applied

All game tuning lives in `src/config.ts`:

| Setting | Value |
| --- | --- |
| Board | 5 columns × 6 rows |
| Initial cells | 6 |
| Initial / spawn tiers | Tier 1: 90%; Tier 2: 10% |
| Starting heat / stability / score | 0 / 0 / 0 |
| Heat per accepted action | +4 |
| Merge cooling, resulting tiers 2 / 3 / 4 / 5 | 2 / 4 / 6 / 10 |
| Stability, resulting tiers 2 / 3 / 4 / 5 | 3 / 6 / 12 / 24 |
| Score, resulting tiers 2 / 3 / 4 / 5 | 10 / 30 / 80 / 200 |
| Move / merge / spawn duration | 140 / 180 / 130 ms |
| Input lock | Movement plus the longer of merge / spawn feedback |

Heat and stability clamp to 0–100. A simultaneous stability and heat threshold awards the win. Result evaluation happens before spawn, then again after spawn so a newly filled deadlocked board fails immediately. Spawning samples uniformly among empty slots, including the vacated source. Production uses `Math.random`; pure rules accept injected RNG for deterministic tests.

## Structure

- `src/rules.ts`: plain board state, pure legality and turn resolution, result evaluation, small phase controller.
- `src/input.ts`: grid coordinate mapping and single-pointer tap/drag normalization.
- `src/config.ts`: board, tier, reward, heat, and timing defaults.
- `src/storage.ts`: best-score persistence with memory fallback.
- `src/main.ts`: bootstrap, Phaser board presentation, DOM HUD, short VFX and synthesized audio.
- `src/style.css`: bounded responsive portrait composition and scroll fallback for short viewports.
- `tests/game.test.ts`: renderer-independent rules, input, persistence, and controller lifecycle tests.

GameObjects never determine game state. Accepted actions resolve the entire turn synchronously, including any terminal result and spawn. Animation only presents that committed turn; completion releases the input lock. Restart/menu cancel tweens, timers, effects, selections, and camera effects. Input listeners are registered once, not on each restart.

## Development QA fixtures

Development server only: `/?qa=win` starts with adjacent tier-4 cells and 76 stability; merge them to exercise the victory flow. `/?qa=heat` starts with 96 heat; move the tier-1 cell to overload. `/?qa=tiers` displays all five tier motifs. Click Initialize after opening a fixture. Vite removes these fixture branches from the production bundle. Fixtures use the dev origin's ordinary best-score storage.

## QA boundary

See `docs/EXECUTION_REPORT.md` for executed checks and `docs/PATCH_LOG.md` for the patch record. Physical iOS/Android touch, subjective sound/merge satisfaction, 3–8 minute balance, and tab-suspension behavior remain human QA. Short portrait and landscape viewports intentionally scroll instead of shrinking the board to tiny targets. No keyboard board navigation is supplied.

Next: Aegis audit and Hristo gameplay/art QA. No Game 003 work or Factory extraction is part of this project.
