# OdesosGames rebrand and game shell — Batch 1

## Scope

Rebrands the public portal from Studio Arcade to OdesosGames and standardizes the website-owned game player without changing any game runtime source or gameplay.

## Changes

- Updates public document, route, header, footer, and page-title branding to `OdesosGames`.
- Adds a common game-player toolbar with **How to play**, **Settings**, and **Fullscreen**.
- Keeps restart game-owned. The host retains failure retry only for a failed iframe load.
- Makes How to play expose each catalog game's factual description and existing controls.
- Adds a display-and-access settings entry point. It controls the portal theme and explicitly leaves game-specific preferences in each game runtime for the next settings batch.
- Adds catalog viewport policies: free-space Orbit Break, portrait Reactor Stack, landscape-first Last Relay, responsive Station Quartermaster, and 16:9 Signal Below.
- Adds a portrait orientation message for landscape-required Last Relay.
- Preserves the existing isolated iframe, loading, retry, and responsive flow behavior.

## Validation

- Baseline `npm.cmd run check` — passed.
- Baseline `npm.cmd run build` — passed; existing Vite advisory Phaser chunk-size warnings only.
- Final `npm.cmd run check` — passed.
- Final `npm.cmd run build` — passed; same advisory warnings only.
- `npm.cmd run verify:pages` — passed for the homepage, all five direct pages and embeds, linked assets, and Signal Below scene SVGs.
- Local browser checks verified all five route titles, their isolated iframe URLs, and all three shared player controls. Help and Settings dialogs opened for Orbit Break; fullscreen entered and exited for Signal Below; the Signal Below scene shell computed a 16:9 aspect ratio; Last Relay showed its portrait orientation guidance at a 390 × 844 viewport.

## Remaining human QA

- Verify touch interaction, audio, and fullscreen exit behavior on physical Android and iPhone browsers.
- Visually review the player chrome alongside every game on target desktop and mobile browsers.
- Confirm the exact wording and placement of game-specific settings when Batch 2 adds their runtime-owned controls.
