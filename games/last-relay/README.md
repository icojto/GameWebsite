# Last Relay — Game 003

Defend the final communications relay across three lanes and ten waves. A standalone, landscape-first Phaser + TypeScript + Vite game for touch and mouse.

## Run

Requires Node 24+ (tests use native TypeScript stripping) and npm. From this folder, on Windows:

```powershell
npm.cmd install
npm.cmd run dev -- --host 127.0.0.1
```

Open the URL Vite prints. For a production build:

```powershell
npm.cmd run check
npm.cmd test
npm.cmd run profile
npm.cmd run build
npm.cmd run preview -- --host 127.0.0.1
```

Preview uses the first available port starting at 4173. The build is in `dist/` and works from a relative static-host path. No backend, accounts, analytics, remote fonts, or runtime network APIs.

## Play

1. Establish the uplink. Select a numbered lane slot, then buy a Rapid Turret or Heavy Cannon.
2. You start with 100 energy, enough for two Rapid Turrets. Kills pay for the remaining lane.
3. Preparation lasts seven seconds; launch early when ready. Purchases and replacements also work during combat.
4. Enemies move from right to left. Your defences automatically shoot the foremost enemy in their own lane once it enters range.
5. Replacing any defence costs the full new price. There are no refunds or upgrades.
6. Survive wave ten with relay HP remaining to restore the signal. Pause to change reduced-effects settings; leaving the tab pauses the game.

Landscape phone controls need no keyboard. Portrait phones show a rotate prompt and pause an active match. Press Resume Uplink after rotating back. No sound is included in v0.1.

## Factory defaults applied

All balance and wave data lives in `src/config.ts`.

| Setting | v0.1 |
|---|---|
| Starting energy / relay HP | 100 / 10 |
| Rapid turret | 50 energy; 8 damage; 0.5 s cooldown; targets from 43% lane progress |
| Heavy cannon | 75 energy; 48 damage; 2.4 s cooldown; targets from 39% lane progress |
| Standard | 32 HP; 0.031 lane progress/s; 1 relay damage; 10 energy |
| Runner | 21 HP; 1.35× speed; 1 relay damage; 8 energy |
| Heavy | 78 HP; 0.65× speed; 2 relay damage; 15 energy |
| Wave counts | 6, 8, 10, 12, 14, 16, 18, 20, 22, 26; 152 total |
| Escalation | Mixed formations, shorter spawn intervals, HP scale 1.00–1.65 |
| Intermission | 2 s clear state followed by 7 s preparation |
| Runtime bounds | 10 active enemies; 64 transient effects maximum |
| Simulation | 60 fixed steps/s; frame catch-up limited to 100 ms |

Wave schedule time continues when capacity is reached; overdue spawns wait and enter as space becomes available. Nothing is dropped. Enemies use lane ID plus scalar progress; there is no physics or pathfinding.

## Small explicit architecture

- `src/model.ts`: match phases, wave scheduling, three lane arrays, defence cooldowns, lane-only targeting, hitscan combat, exactly-once removal, economy, relay health, result evaluation, bounded transient effects. Pure TypeScript with no rendering dependency.
- `src/config.ts`: stat profiles, feedback timing, ten explicit token-based formations. Changing formations requires no director changes.
- `src/main.ts`: Phaser procedural presentation, fixed-step driver, mouse/touch buttons, pause, menu/results, and development fixtures.
- `src/storage.ts`: validated localStorage settings/best record with exception-safe fallback. No mid-match save.
- `tests/`: model correctness, campaign simulation, restart regression checks, and sustained model pressure profiling.

One enemy body family uses scale, marking count, and warm accents for variants. Cyan silhouettes distinguish rapid twin barrels and the heavy cannon. Effects include hit flash, recoil, tracer/muzzle flash, four death sparks, danger rails, activation ring, relay damage pulse, and a restored-signal pulse. Reduced effects retain essential tracers and feedback.

No pooling: ten enemies and bounded short-lived effects do not justify a pool service. No ECS, generic tower framework, or Factory Core promotion.

## Development QA

Open the dev server with `/?qa` for explicit fixture buttons:

- **Pressure fixture** sustains ten enemies and three defences, with attack/death VFX and Phaser frame-delta percentiles. It artificially replenishes enemies and holds them before the endpoint; it is not a normal gameplay formation.
- **Campaign 20×** follows a deterministic purchase strategy through all ten waves at accelerated simulation speed. This checks rendering and result flow, not human reaction time or normal-speed performance.
- **Defeat fixture** places a heavy at the endpoint of a relay with 2 HP.
- **Reset fixture** starts a fresh match.

Fixtures and metrics are absent from the production build, and QA results/settings are not persisted. Node tests also verify a campaign at normal simulation speed, an undefended defeat, denied storage, and 100 restarts.

See `docs/EXECUTION_REPORT.md` for measured validation and `docs/PATCH_LOG.md` for this implementation. The original supplied brief is preserved in `docs/DESIGN_BRIEF.md`.

## Hristo human QA

On physical iOS Safari and Android Chrome, test landscape touch comfort, orientation changes, interruptions, repeated restarts, high-population readability, performance/thermal behavior, and reduced effects. Assess lane-priority decisions, pressure escalation, defence differentiation, destruction feedback, and whether sessions feel within the 5–10 minute target. Desktop viewport emulation is not physical-device evidence.
