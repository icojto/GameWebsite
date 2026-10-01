# Orbit Break v2 — complete revamp

## Mission and boundary

Build the complete Orbit Break v2 inside the existing GameWebsite player viewport, on `codex/orbit-break-v2` from `main` (`2c78f3e5fabcc45d58077ebcedeef5e4fe977163`). Keep Space/click/tap as the sole gameplay action, preserve other games and the Player v2 shell, and submit one Draft PR for human review. No backend, account, monetization, new dependency, source-config writes from DEV, or merge is included.

The separate worktree for this task is under `C:\Users\mlgjm\Desktop\GameTests\GameWebsite-Orbit-Break-v2`; the original website checkout is untouched.

## Architecture and gameplay

- `RunState` is the renderer-independent run model. It owns phase, score, elapsed time, difficulty/tier, reverse direction, formation selection, telegraphed projectiles, collision, and bounded projectile groups. `OrbitBreakScene` owns Phaser drawing/input and coordinates UI, audio, profile, and resize.
- Difficulty ramps continuously to a configurable maximum, with five tier thresholds and attack-interval clamps. Weighted formation pools are tier-gated, cooldown-limited, and constrained by consecutive-use and simultaneous-projectile limits. Single remains available at tier 1 when it is the only eligible family.
- Single, sequential Double, angular Arrow, timed Line, and late-tier Bombardment are procedural. Bombardment begins at a narrow 10%-circle attack arc and widens to a hard maximum, with minimum angular separation and count bounds. Every shot has a readable warning marker/ray, lead time, ping/hold settings, and launch delay before travel.
- Pause freezes the run state, pauses music, and offers Resume, Settings, and confirmed in-game Main Menu. The game never navigates the website for Main Menu. Restart, death, score, and best-score paths remain intact.
- Resizing repositions the orbit and scales live projectile distances rather than restarting the run. The scene clears its input, resize, dev, UI, and audio resources on shutdown.

## Development panel and session logger

- A generic, registration-based `DevPanel` is dynamically imported only under `import.meta.env.DEV`; the built production bundle has no DEV panel text, controls, or trigger. Ctrl+Shift+D or the DEV button toggles it. On narrow frames it becomes a bottom sheet.
- Categories: Run, Difficulty, Projectiles, Telegraph, Formations, Profile, Quests, XP / Economy, Cosmetics, Visual, Audio, QA, and Session Log. The Orbit adapter exposes runtime readings, config clamps, formation weights/tier values, manual formation triggers, infinite lives, artificial difficulty and scores, quest completion/refresh, economy tests, cosmetic previews, and reset confirmations.
- Tuned values are runtime/session values; the panel does not write source code or tuning to localStorage. The logger tracks values different from their baseline in a Map, excludes restored baseline values, records named snapshots with notes/timestamp/runtime context, and offers current/all CSV and JSON downloads. Save Test requires a name. Clear Session restores baseline controls and clears snapshots. Reload destroys logger and tuning state without clearing the player profile.
- The DEV profile/economy actions explicitly marked persistent are QA mutations of the same local player profile; session-only unlock-all, previews, and artificial scores do not persist.

## Browser-local profile and economy

- New versioned key: `orbitBreak.profile.v2`. It holds cumulative XP, Stars, five quests, unlocked cosmetic sets, four equipped theme IDs, ten personal scores, best score, and quest serial. Legacy `orbitBreak.bestScore` is read during migration and kept in sync for compatibility. Invalid/corrupt profile data falls back safely; unavailable storage leaves a live in-memory profile.
- XP requirements scale by 1.2 from 100, preserve overflow, and cap displayed level at 10. Stars are granted by manually claimed quests. Five weighted repeatable quest slots track survival, one-run score, dodges, reversals, formations, Double attacks, difficulty, or completed runs. Claiming grants XP/Stars and replaces only the claimed slot; refresh controls are separate.
- Personal scores sort descending and retain ten entries. Developer artificial scores remain session-only. The Locker has Player, Projectile, Orbit/Core, and Planet categories. Default plus Water, Nature, Fire, Light, and Chaos themes can be mixed independently. Water/Nature/Fire cost Stars; Light and Chaos are level-gated. Locked/visible/mystery states are shown, and themes change only procedural rendering, never run mechanics.
- Score, XP, Stars, best, and a progress bar remain visible in the HUD. Quest, Locker, and Scores buttons fade during play, while Pause remains accessible. Modal dialogs use semantic buttons, Escape, focus trapping, and internal scrolling. Level-up/reward feedback is restrained and audio respects settings.

## Homepage preview and performance

- The existing Orbit hero/card drawing gains a six-second CSS cycle: orbit wake, visible player motion, four approaching hazards, a reversal/dodge beat, then a clean loop. `prefers-reduced-motion` disables these animations. Navigation remains a link; the full game runtime is not duplicated in the card.
- The run model reuses an event object, caps frame delta and projectile population, and recycles Phaser Graphics objects rather than accumulating particles. Profile writes occur on meaningful actions and at most every five seconds of survival; no per-frame localStorage write. DEV status refresh runs every 400 ms only while visible. Phaser's existing large-bundle warning remains advisory; physical mobile thermal/frame pacing is unmeasured.

## Files

- `games/orbit-break/src/game/config.ts` — typed defaults, five formation tables, difficulty/telegraph/economy tuning.
- `games/orbit-break/src/game/run.ts` — pure run/difficulty/projectile/formation rules.
- `games/orbit-break/src/game/profile.ts` — versioned profile, migration, quests, economy, scores, cosmetics.
- `games/orbit-break/src/game/ui.ts` — HUD, meta panels, pause/settings, quests, scores, Locker.
- `games/orbit-break/src/game/OrbitBreakScene.ts` — Phaser presentation and lifecycle integration.
- `games/orbit-break/src/game/audio.ts` — restrained cues, settings, music pause/resume.
- `games/orbit-break/src/dev/DevPanel.ts` — generic development controls and RAM-only logger/export.
- `games/orbit-break/src/dev/orbit.ts` — Orbit control registry and QA actions.
- `games/orbit-break/src/dev/dev.css` — responsive development drawer/sheet.
- `games/orbit-break/src/style.css` — game HUD, modals, Locker, responsive rules.
- `games/orbit-break/tsconfig.json` — native Node test import compatibility.
- `games/orbit-break/README.md`, `README.md` — updated integration and local instructions.
- `src/main.ts`, `src/styles.css` — lightweight animated homepage preview and local-progress copy.
- `package.json` — `dev:orbit` and `test:orbit` scripts, no dependency changes.
- `tests/orbit-v2.test.mjs` — deterministic native Node logic tests.
- This patch log.

## Automated and browser QA

- `npm.cmd run test:orbit` — PASS, 11 tests covering migration/corruption, quests, XP cap/overflow, scores/cosmetics/session-only DEV, reverse/restart, score/pause/difficulty, five formations/telegraphs/fairness, collision/infinite lives.
- `npm.cmd run check` — PASS.
- `npm.cmd run build` — PASS; existing Phaser size advisories only.
- `npm.cmd run verify:pages` — PASS for homepage, direct routes/embeds/assets, including preserved on-hold Games 003–005.
- `git diff --check` — PASS.
- Production preview of `/games/orbit-break/` — PASS: game iframe loaded, DEV absent. The built Orbit asset contains no `ODESOS DEV`, `dev-trigger`, or logger text.
- Browser DEV flow — PASS: tune a parameter, see one changed value, save named snapshot, activate CSV/JSON downloads, clear session, reload; the profile's Level/Stars remained while the session log vanished. Download control activation was observed, but downloaded-file contents were not independently inspected.
- Browser player flow — PASS: start, score, pause/settings/menu confirmation, quest claim and replacement, XP/Stars persistence, Locker purchase/mixed equipment persistence, and paused-run state preservation through a portrait-to-landscape resize.
- Twelve browser viewport sizes — all loaded with zero embedded-document overflow; score, XP, Stars, Pause control, canvas, and pre-run meta controls were inside the iframe bounds. Quest and Locker were interactable at 640×360 outer size; Quest used a small amount of intentional scrolling inside its modal card.

| Outer viewport | Embedded size | Embedded overflow | HUD/menu |
|---|---:|---:|---|
| 1920×1080 | 1439×690 | 0×0 | PASS |
| 1366×768 | 1301×490 | 0×0 | PASS |
| 1280×720 | 1215×459 | 0×0 | PASS |
| 1024×768 | 959×490 | 0×0 | PASS |
| 430×932 | 389×539 | 0×0 | PASS |
| 390×844 | 349×488 | 0×0 | PASS |
| 360×800 | 319×463 | 0×0 | PASS |
| 360×640 | 319×370 | 0×0 | PASS |
| 932×430 | 867×359 | 0×0 | PASS |
| 844×390 | 803×359 | 0×0 | PASS |
| 800×360 | 759×359 | 0×0 | PASS |
| 640×360 | 599×319 | 0×0 | PASS |

These are browser layout/state measurements, not physical-device or subjective readability certification. The host website may scroll vertically as a normal page; the embedded game document did not.

## Internal gates and human QA

- Gate A — PASS: core run model, difficulty, five formations/telegraphs, one-action controls, pause/settings/menu, DEV foundation; corrected tier-1 formation fallback and early Bombardment spread.
- Gate B — PASS: versioned profile, legacy migration, five quests, XP/Stars, top ten, mixed cosmetics, persistence; prevented session-only unlock-all from saving a locked equipped theme.
- Gate C — PASS with human visual/audio limits: homepage preview, production gating, automated commands, DEV/browser flows, 12-size matrix, resize state preservation, patch log.

Human: on actual iOS/Android and representative desktop browsers, start a run, score to a nontrivial tier, resize/rotate repeatedly, pause, adjust sound, resume, enter/exit player fullscreen, die, claim a quest, level up, buy/equip mixed cosmetics, refresh and confirm persistence. In DEV, change projectile speed, trigger every formation, save multiple named tests, export CSV and JSON and inspect file contents, reload and confirm the session log is gone but profile remains. Review touch target comfort, color/telegraph readability, audio balance, subjective difficulty/fairness, frame pacing, and thermal behavior. No physical-device test has been run.

## Known limitations

- Browser download buttons were exercised, but exported file contents were not independently opened in this QA pass.
- The in-app browser's console recorded a `MutationObserver.observe` TypeError with no source URL during page instrumentation/reloads. No `MutationObserver` exists in portal or Orbit source, and the game continued to render and respond; the source of this browser-console entry was not independently proven.
- DEV actions that deliberately edit quest progress, XP, Stars, or persistent scores affect browser-local player data; use a disposable test profile for manual QA.
- Cosmetic art is procedural; final studio-supplied art is not part of this implementation.
- Existing Phaser bundle-size warnings persist. No new package was installed.
- No merge or deployment is performed by this branch/patch log.
