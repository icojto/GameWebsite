# Patch log — 2026-09-24

## Game 003 / Last Relay v0.1

- Initialized the intentionally empty game folder as its own Git repository on `codex/game-003-last-relay`. No parent/sibling game modified, remote created, or merge performed.
- Implemented three lanes, two fixed-slot defence types, one procedural enemy family with Standard/Runner/Heavy stats, energy, relay HP, ten data-driven waves, complete results and restart.
- Kept the simulation independent of Phaser. Lane-only targeting, exactly-once removal, spawn backpressure at ten entities, fixed stepping, bounded effects, and immediate defeat avoid lifecycle and scaling failures.
- Added landscape mouse/touch controls, responsive viewport rendering, portrait rotation prompt, pause/resume, reduced-effects settings, and guarded local best-record storage.
- Added model/campaign/lifecycle tests, a 36,000-step pressure profiler, and development-only browser fixtures for rendering pressure, accelerated campaign, defeat and reset. Fixture results do not write local records.
- Added source design brief, exact commands, explicit defaults, architecture notes, validation report and physical-device human-QA list.

## Issues resolved during validation

- Initial npm registry/cache access was denied by the sandbox; reran the scoped dependency installation with approved permission. Installation succeeded with no vulnerabilities reported.
- Replaced a Vite chunk-map configuration incompatible with the installed Vite types with a chunk-selection function.
- Replaced a narrowed-phase comparison after endpoint removal with the actual result guard, preserving immediate defeat handling and satisfying TypeScript.

See `EXECUTION_REPORT.md` for validation evidence and remaining human QA. This patch ends at Game 003; no Game 004 work is included.
