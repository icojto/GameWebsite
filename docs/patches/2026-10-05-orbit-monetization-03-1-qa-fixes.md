# Patch 03.1 — Orbit monetization human-QA follow-up

## Baseline and scope

Repository: icojto/GameWebsite. Checkout: `C:\Users\mlgjm\Desktop\GameWebsite`.
PR #17 was verified MERGED at 2026-10-05 15:14:31Z, head `b6bee9ac1a2a6844417f79feeda97bce8e4f862d`. Its merge/current main is `fae76e332eee02741ec713b8babba2eca8990cf0`.
New branch from that main: `codex/orbit-monetization-v1-qa-fixes`. Initial checkout was `codex/odesos-ads-v1-1-boundary-fix` at `4479288fb775fdb71c2739e1cc5541b6a749ff92`; inherited package-lock status marker has no content diff and is excluded from staging. Other worktrees and standalone game projects are untouched.

Focused follow-up only. Website policy/panel/banner and game presentation/reward ownership preserved. PLAY/RESTART safe events, startup precedence, no death trigger, eight-second offer and exactly-once/run-cap rules remain unchanged. No Reactor integration, provider, tracking, dependency, compliance or deployment work.

## Corrections

- Explicit global/placement limit-enabled flag; Unlimited fresh/reset global and real/generic interstitial placements. Enabled finite zero blocks, actual shown history remains across toggles. Legacy numeric global config presents a non-modal choice without changing unrelated preferences or game saves. Global persistence versus session-only placement tuning is explicit.
- Startup/interstitial mocks auto-complete with no player close. Rewarded Skip grants nothing; typed reason distinguishes player skip from injected close. QA abort and existing fail-open/watchdog/disposal remain. No future SDK-control assumption.
- Current status/reason differs from retained last result/reason; active/cooldown waits, cap/placement restrictions, shown/completed and actual acknowledgments are visible. Banner has no video completion. Clear Stats preserves safety history.
- Contextual help covers every website editable/action control and grouped readout, plus all 12 Orbit Ads Integration entries. Delayed hover, focus, pinned tap, outside dismiss, Escape precedence, disabled-control help, viewport bounds and disposal are implemented independently per document. Live updates preserve focus/help.
- Five test shortcuts have precise friendly labels and approved-event selector, retain preview identity and documented Force boundaries. See `docs/ads-controls-reference.md`.
- Existing bounded 2,000-request safety/replay budget and 200-event log remain; Unlimited is not unbounded history.

## Incremental file inventory

| Files | Purpose |
| --- | --- |
| `src/ads/model.ts` | Typed cap flag, fresh default, shared numeric bounds |
| `src/ads/placements.ts` | Unlimited real Orbit interstitials |
| `src/ads/service.ts` | Cap enforcement/capabilities, derived summaries, retained results |
| `src/ads/dev/settings.ts` | Legacy-choice loader, generic preview placements |
| `src/ads/dev/help.ts` | Website fields/actions/readout metadata |
| `src/ads/dev/panel.ts` | Choice, cap editor, summaries, help, five actions/abort |
| `src/ads/dev/styles.css` | Help/control layout without player resize |
| `shared/dev/help.ts`, `shared/dev/help.css` | Small local-document help behavior/styles |
| `src/ads/bridge.ts`, `src/ads/presentation.ts` | Validated optional close reason and shown rewarded skip guard |
| `games/orbit-break/src/ads/GameAdPlayer.ts` | Type-specific close gate and exactly-once reasons |
| `games/orbit-break/src/ads/OrbitAdClient.ts` | Forward close reason metadata |
| `games/orbit-break/src/ads/dev/MockAdView.ts` | Rewarded-only skip, non-skippable surface/key handling |
| `games/orbit-break/src/dev/DevPanel.ts`, `ads-help.ts` | Local help only in Ads Integration |
| `scripts/verify-ads-production.mjs` | Reject new help/status/skip DEV markers |
| `tests/ads.test.mjs`, `tests/orbit-ads.test.mjs` | Caps over 100, migration, help, status, actions, skip/races |
| `docs/ads-blueprint.md`, `docs/ads-qa.md`, `docs/ads-controls-reference.md`, this log | Current contract, exact QA, historical separation and handoff |

No `OrbitAdFlow`, Reactor, catalogue, package manifest, lockfile contents or deployment workflow changes. See the commit diff for exact insertion/deletion totals.

## Validation executed

| Command | Result |
| --- | --- |
| `npm.cmd run check` | PASS portal/all game TypeScript |
| `npm.cmd run test:ads` | PASS 47 |
| `npm.cmd run test:orbit-ads` | PASS 58 |
| `npm.cmd run test:orbit` | PASS 11 |
| `npm.cmd run test:portal` | PASS 4 |
| `npm.cmd run test:reactor` | PASS 15 |
| `npm.cmd run build` | PASS, existing Phaser chunk-size warnings |
| `npm.cmd run verify:ads-production` | PASS 32 artifacts |
| `npm.cmd run verify:pages` | PASS public routes/embeds/assets, hidden builds, metadata/404; initial sandbox localhost EACCES resolved with local-network permission |
| `git diff --check` | PASS |

135 tests pass. Production remains Null with DEV imports excluded; no new dependencies/assets beyond tiny code-native help CSS. Current production portal JS47.25kB/gzip14.21 and CSS21.56kB/gzip5.76; Orbit JS1427.56kB/gzip374.17. No matched baseline measurement was taken, so no exact bundle delta is claimed.

Browser: unchanged iframe rectangle (1215.333×459.458), non-modal host, help/typing/Escape checks, 360×800 and 640×360 help within viewport/no horizontal overflow, auto-complete interstitial, ignored Escape/Space/Enter, QA abort, rewarded preview SKIPPED/no reward/zero acknowledgment, game-local help. Production Orbit PLAY and disabled shortcut checked. Detailed procedure is at the top of `docs/ads-qa.md`.

Not verified: physical Android/iPhone, audio listening, screen-reader/zoom/OS reduced motion, full real-trigger replay, long soak or accessibility certification. Logic regressions cover trigger/reward safety. Prior source-less MutationObserver error is unattributed; no clean-console claim. Legacy migration is logic-tested, not a seeded-browser migration acceptance run. No exhaustive network audit.

## PC2 safe refresh

PC2 does not update automatically. In its portal checkout, first run `git status --short`; if nonempty STOP and preserve the local work. Do not reset/stash/overwrite it. With a clean checkout:

```powershell
git fetch origin
git switch --track origin/codex/orbit-monetization-v1-qa-fixes
```

If that local branch already exists, use `git switch codex/orbit-monetization-v1-qa-fixes` then `git pull --ff-only` instead. If Git reports another worktree owns the branch or histories diverged, stop rather than forcing. Verify `git rev-parse HEAD` against the PR head, then:

```powershell
npm.cmd ci
npm.cmd run dev
```

Open the printed local URL plus `/games/orbit-break/`. This launches the full host bridge. Production QA: `npm.cmd run build` then `npm.cmd run preview`. Do not use standalone `dev:orbit` for bridge acceptance.

## Prompt 4 and delivery boundary

Reactor must inherit explicit unlimited caps, shared status/help conventions, non-skippable startup/interstitial MOCK behavior and rewarded skip-without-reward. It must define its own gameplay/reward contract. No Reactor implementation here. New Draft PR targets main; human merge only, no deployment performed.
