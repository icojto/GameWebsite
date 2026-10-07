# Stage 1 evidence journal — 0.5.0

Browser operations used actual CUA input/read-only DOM/snapshots. Deterministic tests validate machine contracts, not physical Android behavior. No broad 332-case rerun or live deployment was performed.

## Sessions and provenance

- Pre-fix fresh DEV UUID 4db12f77-5077-447b-9cd6-13a33e36247a. Captured exact FAI sequence and terminal input leak. HQA-005's 9/0/9 was not reproduced: timing block was not-enough-active-play; cooldown is separate; genuinely eligible PLAY and RESTART worked before policy changes (none made).
- Implementation DEV UUID 0c84fda3-bc1b-4678-b176-8a1ce546b083. Native desktop pointer drag/tap, terminal/dialog and eligible host ad flows, MVP simulations/help/limits/scopes observed.
- Intermediate rebuilt DEV UUID 5f3d70a2-05f8-4790-ad0b-6cc7d5c5ee08. The essential-control matrix detected wide-short clipping; CSS coverage was repaired before the final deterministic suite. reactor-essential-controls-final.json is the corrected authoritative matrix; prior matrix is historical geometry evidence only.
- Final functional-source DEV UUID 38e833d4-9ac8-4611-af7f-a4687cd7ceaa, build 8f614255-beca-43dd-9488-9617f33ee3f2, base 7571df5c..., dirty=true while testing. Exact launcher URL/browser build matched; mounted board and Connected renderer verified. Final fallback screenshot uses actual 640×280 (allocated 599×204); corrected wide-short screenshot uses actual 844×390 (allocated 803×314). Earlier mislabeled attempts are annotated, not discarded.
- Fresh production preview build 913c4732-6761-4e35-9232-a93effaaf6bc, port 5192. Reactor Initialize/Pause/Resume/Restart and Orbit PLAY/result/Restart/Pause/Resume ran with Null, no website/game DEV controls. Native fullscreen button toggled its state and player geometry; read-only fullscreenElement signal stayed false, so native fullscreen API acceptance is not asserted.

## Targeted outcomes

| Area | Observed evidence | Limit |
|---|---|---|
| Layout | 13 required sizes + 4 below 360; latest matrix all essentialInside, visible controls >=44px; square canvas; no gameplay internal scroll. Graceful fallback at allocated <240×280. | Real Android/browser chrome and subjective readability remain human. |
| Run preservation | Paused resize chain retained UUID, board, moves=2, powers=1 each, pending=null, no completed entries. | Hardware orientation and pending physical scenarios remain human. |
| Pointer | Desktop native drag 0→1 exactly one accepted move; tap pair back gives move 2. Real capture/gesture deterministic tests cover cancel/invalid/resize mapping. | No actual Android touch event was observed. |
| Orbit terminal | Blank mouse backdrop, Space/Enter, QUESTS/Escape retained terminal UUID/direction/score; explicit Restart creates new UUID. | LIVE and physical pointer confirmation still required. |
| Normal Orbit ads | Real PLAY + RESTART: requests=2, accepted=2, prepared=2, shown=2, completed=2, blocked=0; approved safe events. | This does not identify historical human 9/0/9 cause. No Force proof used. |
| Reactor stale result | Exact old-result sequence now clean INITIALIZE/Heat 0; guarded delayed callback regression and history remain. | Post-merge reproduction remains required before closure. |
| MVP | 29/204 default visible controls; Advanced closed; timing/master/finite cap block normally; Clear observations retains shown safety count; NoFill/Timeout/Error no shown/reward; QA Skip external-close; next outcome restored. Help Escape and native numeric keyboard usable. | Locator fill without native blur did not commit policy here; documented as automation limitation. |
| Production | Both Null game journeys and absent DEV controls; static production verifier scans 34 artifacts. | No live deployment/provider approval implied. |
| Workbook | Only Dashboard worksheet and number format style native parts changed; baseline hash unchanged; formulas/recalc/render and release boundaries pass. | Native Excel recalculation not exercised. |

An early implementation-only panel constructor regression was found by browser and fixed before final validation. One trailing-space diff failure was repaired; final diff check passed. Previously unattributed automation MutationObserver diagnostics are not represented as an application console-clean result.

## Files

Raw pre/post snapshots remain in the local evidence folder. Curated files committed alongside this journal: essential-controls matrix, resize/run preservation, Orbit terminal/host/restart state, final DEV readiness, production snapshots, dashboard validation and the Stage 1 review workbook. validation.json retains exact exits including repaired whitespace history. Bundle impact compares actual final production file bytes to PR #20's recorded artifact sizes, not a new baseline build or performance benchmark.
