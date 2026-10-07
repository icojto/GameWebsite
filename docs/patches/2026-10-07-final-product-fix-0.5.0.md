# Final product fix 0.5.0 — Stage 1

Draft implementation and targeted machine retest. No merge, deployment, physical Android pass or final product approval is claimed.

## Preflight and authoritative record

Primary checkout main was 42e8b2007980756a21d17f0e5c0bbd9c8d13d325 with unrelated untracked QA outputs. It was preserved. Safe fetch found origin/main 7571df5c5990ba1e7bd55706b8aa16ebc994da8f, the PR #20 merge. The reused clean managed worktree started there; branch `codex/final-product-fix-0.5.0`.

Authoritative input: `OdesosGames_Full_QA_Live_Local_FINAL_HUMAN.xlsx`, SHA256 `3c2680f53d86338463338369089d8323822b2224bf539873f069df6430cc1067`. Independently counted 332 IDs, 316 Pass, 8 Fail, 8 N/A, no Blocked/Pending. Applicable 324; pass rate 97.53%; completion 100%. No row status, Bug Log history or Sign Off was changed.

## Reproduction and root causes

| Defect | Evidence before changes and treatment |
| --- | --- |
| V2-004 / HQA-001 / HQA-003 | The host's minimum player height exceeded short viewports and portrait aspect allocation squeezed its width. At 640×280 the old frame extended beyond the visible viewport. Reactor header used a single competing flex row. Human compact/Android evidence remains authoritative. Shared host allocation, header rows and a practical fallback address these owners together. |
| HQA-002 | Physical Android evidence says taps work, drag does not. Old path depended on separate Phaser pointer-down/up delivery without explicit application-owned capture. New single native Pointer Events owner/capture path uses current canvas bounds, cancels safely and prevents board scrolling. Desktop mouse drag and taps passed; physical Android is still required. |
| HQA-004 | Old background action handled non-playing terminal state as a start opportunity, and UI backdrop did not intercept the canvas. A pre-fix canvas/Space journey started another run. New phase guard permits background actions only in menu/playing and terminal UI owns the backdrop. Dialog close restores safe focus. |
| FAI-001 | Exact Force Fail → Reinitialize → Pause → Main Menu reproduced old CORE OVERLOAD over fresh Heat 0. Result text was retained in a shared menu, with an unguarded delayed callback. Reset all menu presentation fields and invalidate/guard callback epochs and terminal state identity. Completed history remains exactly-once. |
| HQA-005 | Fresh pre-fix timing-ineligible PLAY reported `not-enough-active-play`; Make Eligible did not clear cooldown. Properly eligible real PLAY and RESTART both succeeded even before this patch. The human 9 requests/0 accepted/9 blocked result could not be recreated in a fresh eligible session; its exact historical cause is unknown. Policy/defaults were not changed or bypassed. MVP now exposes actual last placement/result/block reason and current eligibility, and normal host/flow regression proves fresh eligible PLAY/RESTART. Human failure stays open pending the prescribed fresh-session retest. |

## Implementation

- Reactor native pointer capture accepts one release per owner; invalid moves, pointercancel/lost capture, blur and disabled state are safe. Pointer conversion uses current CSS bounds and Phaser logical dimensions. Phaser's old mouse/touch path is disabled to avoid duplicate delivery.
- Reactor INITIALIZE presentation is reset on fresh run and menu. Epoch and state/phase guards reject delayed old result rendering. Existing ad flow, scores and terminal history stay owned by their existing lifecycle.
- Host player height is bounded by viewport minus the measured action bar and 16px allowance. Short portrait allocations use the available width. Resize does not change iframe source/remount.
- Reactor header/instruction text has separate rows; essential powers remain visible in constrained mode, compact controls keep usable targets, canvas remains square. Both games show a blocking run-holding fallback below **240×280 allocated game CSS pixels**. The host page may scroll to the player; gameplay documents do not gain internal scrolling. Modals/inspectors may scroll intentionally.
- Orbit terminal phase rejects background pointer/keyboard action. Explicit result buttons and neighboring dialogs remain usable, with dialog focus restored.
- AdService adds read-only session shown and per-run attempt diagnostics. No request acceptance, timing, cap, safe-event, reward or Force policy was altered.

## Ad Dev before/after

The old panel exposed most engineering fields across multiple open sections. The new default view has concise status, five switches, three timing/limit controls with obvious Unlimited, ordinary test buttons, timing/cooldown shortcuts, one-shot outcomes, rewarded diagnostics, eight recent concise events and explicit observation/reset actions. The browser counted **29 visible controls out of 204 attached controls (14.2%)** with Advanced closed, including help/close controls. One collapsed **ADVANCED QA** preserves placement tuning/counters, approved semantic-event selector, Test safe transition, explicitly named Force bypass, full policy/courtesy/mock/provider/bridge/raw/config/inspection/migration tooling. Controls are moved, not cloned. Numeric editing was verified with native keyboard input because the automation locator fill did not commit change-on-blur in this environment.

Reset Defaults restores ad config without touching saves or safety history. Clear Stats/Clear Session Stats clear observations without replenishing cooldowns, caps, run attempts or receipts. Generic tests never apply game rewards. Interstitial/startup retain the actual non-player-skippable presentation policy. Skip outcome is QA-injected external close, distinct from actual rewarded player Skip.

See [QA contract 0.5.0](../qa-contract-0.5.0.md) for controls, selectors and migration.

## Targeted machine evidence

DEV sessions were launched with qa:dev, exact printed UUID URLs, real browser transport, mounted canvases and connected game renderers. Historical observations use sessions `4db12f77-5077-447b-9cd6-13a33e36247a` (pre-fix) and `0c84fda3-bc1b-4678-b176-8a1ce546b083` (implementation). An intermediate rebuilt session was `5f3d70a2-05f8-4790-ad0b-6cc7d5c5ee08`, build `ebea9f98-e769-4d2b-871c-96ebbe8f8178`. Final functional source was launched in session `38e833d4-9ac8-4611-af7f-a4687cd7ceaa`, build `8f614255-beca-43dd-9488-9617f33ee3f2`; actual browser build, mounted board and Connected renderer matched. Build identity is serve startup identity; dirty=true during tests. Source changes were rebuilt and the launcher restarted before final confirmation.

Reactor exact FAI reproduction now renders INITIALIZE REACTOR/Heat 0. Native browser mouse drag 0→1 accepted exactly one move, taps returned it with a second move. Paused resize chain retained run ID, board, two moves, both inventory counts, null pending transition and zero new completion records. Required viewport sizes: 320×800, 360×640, 390×844, 412×915, 430×932, 640×360, 844×390, 932×430, 768×1024, 1024×768, 1280×720, 1366×768, 1920×1080. Additional 640×320/280/240/200 use fallback when the allocated game frame is below the support boundary. All tested canvas rectangles stayed square. No physical touch/orientation pass is inferred.

Orbit terminal backdrop mouse/Space/Enter and QUESTS/Escape preserved terminal phase, run ID, direction and score. Real PLAY then RESTART yielded 2 requests, 2 accepted, 2 prepared, 2 shown, 2 completed, 0 blocked; safe events were play-requested/restart-requested, new run UUID only at restart. Make Eligible alone preserved cooldown and did not show an ad.

MVP normal Test Interstitial blocked on timing; finite zero and master OFF blocked normally. Advanced stayed collapsed until explicitly opened; recent log stayed eight entries. Help Escape dismissed help while panel stayed open. Numeric native keyboard and keyboard navigation worked. No Fill/Timeout/Error settled without showing/reward; QA Skip settled external-close/no reward and next outcome reset Complete. Clear observations retained the actual session shown safety total. There was one early panel-construction regression during implementation; browser detected it, it was corrected and the final panel rebuilt. No console-clean claim is made for previously unattributed automation MutationObserver diagnostics.

## Dashboard and workbook

The separate Stage 1 review copy changes Dashboard semantics only, retaining 316 Pass / 8 Fail / 8 N/A and every native part of all other worksheets byte-for-byte. Only Dashboard worksheet XML and appended dashboard number format styles change. Formulas derive N/A, applicable, pass/completion and release gate. Gate requires zero Fail, zero Blocked/Pending, all applicable Pass, zero open applicable S0/S1 and explicit completed targeted retests. V2-003 stays Deferred/N/A. In-memory boundary checks proved a retest Yes flag alone cannot release failures and Fail→Blocked reduces completion. Artifact Tool recalculation/render and saved-package independent audit passed; native Excel recalculation was not exercised.

`OdesosGames_Full_QA_FINAL_PRODUCT_PASS.xlsx` is **not created in Stage 1**. Final closure and linked Bug Log changes require merge/deploy plus successful required human evidence in this chat.

## Human gate after merge/deploy

1. Physical Android: Reactor source/destination taps plus drag, valid/invalid/cancel paths and coordinates after rotation (REA-024, MOB-027, HQA-002).
2. Physical Android: portrait/landscape fit and short-height recovery, controls reachable, active run/inventory/pending/Pause retained (REA-022, MOB-027, MOB-033, V2-004/HQA-003).
3. LIVE: Reactor compact containment header/instructions, board and powers (REA-022, HQA-001).
4. LIVE: Orbit terminal blank backdrop pointer/keyboard, explicit buttons and dialog close (ORB-012, HQA-004).
5. Fresh LOCAL DEV qa:dev: startup OFF, renderer Connected, Make Eligible then real PLAY; capture actual request/result/reason and exactly one new run (OAD-005, HQA-005).
6. Same fresh LOCAL DEV: finalise old run once; Make Eligible, inspect cooldown and clear it separately for QA if needed; real RESTART with one restart-requested opportunity and fresh run UUID (OAD-006, HQA-005).
7. Reactor exact Powers Depleted → Force Fail → close DEV → REINITIALIZE → PAUSE → MAIN MENU; clean initial menu and preserved single completed history (RAD-011, FAI-001).

Exact remaining release rows: ORB-012, REA-022, REA-024, OAD-005, OAD-006, RAD-011, MOB-027, MOB-033. Open applicable defects remain V2-004, FAI-001, HQA-001..005 until linked successful retests. Historical QA-001..004 and V2-001/002/005 remain closed.

Owner-approved N/A IDs: ORB-009, REA-021, OAD-022, RAD-021, RAD-024, DEV-027, DEV-045, MOB-028. Their original owner notes remain unchanged. N/A is never counted as Pass.

## Non-product backlog

Real provider/AdSense/H5 approval, monetization, legal/CMP, real fill/revenue/global analytics belong to Prompt 5. Deferred subjective audio and any cross-browser/OS/hardware scope not covered by these targeted fixes remain separate owner decisions. Product approval remains Hristo's decision.

## Final deterministic validation

See `final-product-fix-0.5.0-evidence/validation.json` and the Stage 1 report for command exits, test counts, production verification and bundle sizes. Checks are recorded from execution, not inferred from code or PR status.

## Executed final validation and limits

224 tests passed, zero failed/skipped/cancelled: ads 49, portal 5, Orbit 12, Orbit Ads 59, Reactor 20, Reactor Ads 66, QA contract 13. check, build, verify:ads-production (34 artifacts), verify:pages and final git diff --check passed. Initial diff check found a trailing space; repaired without functional source changes. No dependency/package/lock changes. Existing Phaser chunk-size and experimental type-stripping warnings remain non-failing.

The corrected `reactor-essential-controls-final.json` explicitly includes sidebar and portrait Pause/Cool/Upgrade at all 13 required sizes and four graceful fallback sizes, every supported control contained with >=44px targets. Added max-height media coverage fixes the wide-short sidebar clipping detected during browser QA. Native fullscreen API acceptance was inconclusive (UI toggle/geometry worked but read-only signal stayed false). No physical/subjective acceptance is inferred.

Production preview build `913c4732-6761-4e35-9232-a93effaaf6bc` ran Reactor and Orbit Null journeys without DEV controls. See the evidence journal and remaining human queue. All Stage 1 case results and Bug Log records remain historical, no final closure workbook exists yet.

### Production bundle bytes

PR #20 recorded baseline → actual final bytes (not a fresh baseline rebuild/performance test):

| Component | JS | CSS |
|---|---|---|
| Portal | 48,269 → 48,983 (+714) | 21,560 → 21,757 (+197) |
| Orbit | 1,428,281 → 1,429,449 (+1,168) | 8,551 → 8,862 (+311) |
| Reactor | 1,410,571 → 1,413,336 (+2,765) | 11,088 → 12,316 (+1,228) |

[Evidence journal](final-product-fix-0.5.0-evidence/EVIDENCE_JOURNAL.md) · [Exact remaining queue](final-product-fix-0.5.0-evidence/REMAINING_HUMAN_RETEST.md).
