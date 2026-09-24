# Game 004 — Station Quartermaster patch log

## Added

- A 10-day, deterministic station management scenario with four visible modules, three swappable crew, four resources, daily forecasting, and a once-per-day Credits resupply decision.
- A procedural Phaser station schematic with module-specific visuals, warning pulses, crew/status labels, resource feedback, rescue progression, and complete rescue/collapse screens.
- Responsive keyboard- and touch-friendly controls; module cards are large whole-module targets and no drag precision is required.
- A Game 004-specific `localStorage` save envelope. It saves only logical scenario data and rejects corrupt, stale, incomplete, or inconsistent data without rewriting it.
- Unit tests for production, consumption, unique crew assignment, delivery limits, all collapse conditions, rescue, save/load equivalence, unavailable storage, corrupt/incompatible snapshots, and interrupted day resolution.

## Validation

- `npm.cmd test` — 20 passing tests.
- `npm.cmd run check` — passed.
- `npm.cmd run build` — passed.
- Browser: crew moves/swaps, emergency delivery, reload/resume, full 10-day rescue, day-8 oxygen collapse, corrupt-save fallback, and unavailable-storage fallback.
- Responsive browser checks: `390 × 844` portrait and `844 × 390` landscape.

## Known QA boundary

Physical iOS/Android device testing, subjective session pacing, and subjective audio/game-feel testing remain human QA.
