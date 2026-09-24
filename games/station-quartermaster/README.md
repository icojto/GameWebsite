# Station Quartermaster

A compact, deterministic station-management game. Keep Energy, Oxygen, and Food above zero through day 10 while deciding where three crew work among four modules.

## Run

```powershell
npm.cmd install
npm.cmd run dev
```

Open `http://127.0.0.1:4404/`.

```powershell
npm.cmd test
npm.cmd run check
npm.cmd run build
npm.cmd run preview
```

The production preview runs at `http://127.0.0.1:4504/`.

## Factory defaults applied

- Discrete days; only **End day** advances the scenario.
- Three equivalent crew begin on Reactor, Oxygen Recycler, and Hydroponics. Selecting a crew and an occupied module swaps them.
- Every module has baseline output. Staffing multiplies it by four.
- Start: 60 Energy, 52 Oxygen, 48 Food, and 18 Credits.
- Consumption: 17 Energy, 15 Oxygen, and 13 Food per day.
- Emergency resupply costs 12 Credits for 12 Energy, Oxygen, or Food; it may be used once each day.
- Rescue follows a successful day 10 resolution. Core reserves at zero after resolution cause collapse; zero Credits does not.

All gameplay tuning is in [`src/game/config.ts`](src/game/config.ts). The deterministic resolver is in [`src/game/simulation.ts`](src/game/simulation.ts), separate from the browser UI.

## Save and resume

The game saves a complete scenario to browser `localStorage` after assignments, resupply, and completed day resolution. It saves the decision state before resolution animation, so a browser close during animation resumes without a duplicate daily tick.

The save envelope is Game 004-specific and validates schema version, game identity, timestamp, exact state shape, resource bounds, unique assignments, result consistency, and report shape. Invalid or stale snapshots are not altered; the menu explains the fallback. When browser storage is blocked, the game stays playable in the current tab and labels the persistence limitation.

Development-only browser fixtures:

- [`tests/storage-harness.html`](tests/storage-harness.html) writes corrupt and incompatible snapshots for manual recovery testing.
- [`tests/storage-unavailable.html`](tests/storage-unavailable.html) simulates blocked browser storage.

## Scope

No backend, account, analytics, cloud sync, offline progression, inventory, crew traits, upgrades, random events, or generic economy/save framework.
