# Reactor Stack — Game 002

A container-responsive reactor merge game built with TypeScript, Phaser, and Vite. No backend or external asset services.

## Run

Use Node 24 or newer. From the GameWebsite repository root in PowerShell:

```powershell
npm.cmd ci
npm.cmd run test:reactor
npm.cmd run test:reactor-ads
npm.cmd run check
npm.cmd run build
npm.cmd run dev -- --port 5174 --strictPort
```

Full-site development: http://127.0.0.1:5174/games/reactor-stack

Standalone (advertising unavailable): `npx.cmd vite games/reactor-stack --host 127.0.0.1 --port 5176`. The full-site command serves live DEV game code in the real iframe and provides both developer panels with one terminal.

In another terminal, after building:

```powershell
npm.cmd run preview -- --host 127.0.0.1 --port 4174 --strictPort
```

Production preview: http://127.0.0.1:4174/games/reactor-stack. Stop each server with Ctrl+C. Ports are deliberately explicit to avoid other local games.

## Play

Drag a cell to one orthogonal neighbor, or tap the source then the destination. Move into empty space, or merge equal tiers into the next tier. Tier 5 can move but never merge. Invalid actions cost nothing. Every successful action adds a new low-tier cell if the run is still active and a slot is free.

Reach 100 stability to win. Heat reaching 100, or a board without any legal action, causes containment failure. Score and stability are independent. Best score is stored locally; the game still runs when storage is denied. Active runs are not saved. Sound is synthesized following user interaction and can be muted for the session.

## Factory defaults applied

All game tuning lives in `src/config.ts`:

| Setting | Value |
| --- | --- |
| Board | 6 columns × 6 rows |
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
- `src/style.css`: container-driven wide, portrait and compact landscape composition without gameplay-page scrolling.
- `tests/game.test.ts`: renderer-independent rules, input, persistence, and controller lifecycle tests.

GameObjects never determine game state. Accepted actions resolve the entire turn synchronously, including any terminal result and spawn. Animation only presents that committed turn; completion releases the input lock. Restart/menu cancel tweens, timers, effects, selections, and camera effects. Input listeners are registered once, not on each restart.

## Development QA fixtures

Development only: focus the game and press Ctrl+Shift+D for fixtures, tuning and Ads Integration diagnostics. Developer restart bypasses advertising; player Initialize/Reinitialize/Pause-menu Restart uses the unified ad boundary. State-changing tools are locked during resolution and advertising. Tuning is RAM-only.

## QA boundary

See `docs/PRODUCTION_PASS.md` for the current implementation, validation, and human QA checklist. Physical iOS/Android touch, subjective sound/merge satisfaction, 3–8 minute balance, and tab-suspension behavior remain human QA. The active game fits its allocated container without browser-page scrolling. No keyboard board navigation is supplied.

Next: Aegis audit and Hristo gameplay/art QA. No Game 003 work or Factory extraction is part of this project.

## Mock monetization v1
The website owns providers, policy clocks, preparation and limits. Reactor owns start/pause boundaries, board/audio suspension and two independent optional +1 power refills. One shown attempt per power-up per run; skips consume it and pre-show failures do not. Completion must be shown, qualified and match the run/request. A refill never activates the power.

Default startup is OFF. Eligible START and deliberate PAUSE are supported; Pause remains paused afterward. Ordinary play, powers, Resume, scores and automatic/internal state changes request no ads. Production Null and standalone remain playable with one free charge each and no dead ad CTAs. Mock view/courtesy, Why Ads and developer help are DEV-only. Move/Merge/Random Spawn rules and balance remain unchanged.

See [integration patch and human QA](../../docs/patches/2026-10-05-reactor-monetization-v1.md). No real providers, compliance approval, merge or deployment are included.

## QA patch 0.4.1

Constrained embeds retain goal/moves, heat, Pause, Cool and Upgrade with 44px power targets. Heat text and bar share normalized heat/capacity percent. Fresh Run uses real initialized board/inventories and a new UUID; isolated QA Force Win/Fail goes through RESULT and records once. Resize preserves pending animation callbacks and run identity.

From the portal root use `npm.cmd run qa:dev` and its exact session URL. **Open Game DEV** exposes guarded named fixtures, scoped HTML confirmations and read-only JSON View/Download. Clear Scores retains the RAM completion log; the separate scores+log reset clears it. Neither resets tuning, audio or board. See [QA contract](../../docs/qa-contract-0.4.1.md) for fields, selectors, scopes and verification limits.
