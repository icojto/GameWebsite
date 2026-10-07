# Website 0.2.1 — targeted Human-QA fix candidate

Base: `deb10bb33d0d8f7fff740e443e074a28e97f8f08` (current main, merged PR #23).
Branch: `codex/final-human-fixes-0.2.1`. Production stays 0.2.0 until separate approval.
The human's unrelated PASS results remain retained. This record is a focused fix/retest supplement, not a replacement regression workbook.

## Root causes and changes

| Finding | Cause | Candidate behavior / acceptance |
| --- | --- | --- |
| HQA-003 / MOB-027 / MOB-033 / V2-004 and related Reactor layout findings | Player height ignored actual header/top spacing; two-row game navigation; small-frame overlay deliberately froze games. | Measured header, stage top, actions, visual viewport and safe-area padding; one-row game navigation with accessible Menu; no small-allocation pause/overlay. Both games resize their existing renderer. AI matrix passes; targeted device acceptance pending. |
| Reactor hint/control instability | Variable hint wrapping and 60px refill rows changed the board allocation. | Fixed, clipped two-line hints; fixed heat row and count/label regions; 44px portrait touch targets with 30px visual buttons; refill row reduced from 60px to 44px. AI DOM rectangle equality verified. |
| HQA-002 / REA-024 | Pointer-down rejected nonzero touch button values; failed pointer capture abandoned the entire gesture. This explains candidate failure paths but does not prove the physical device's exact cause. | Touch accepts touch semantics independently of mouse button; window release/cancel fallback, owner pointer and capture cleanup preserve one action. Browser mouse drag and deterministic touch=-1/capture-denied tests pass. **Physical Android acceptance remains HUMAN REQUIRED.** |
| HQA-005 / OAD-005 / OAD-006 | Eligibility required active play plus a second cooldown; rewarded ads restarted that cooldown. | One game-open wall clock: `timerSeconds` since entering context or a SHOWN startup/interstitial. Menu, pause, results, background and no interaction count. Rewarded ads never reset it. All requests still require approved safe events and restrictions. |
| Reactor ad opportunities | Initial start used startup/start placements; resume/menu did not request approved interstitials. | Initial PLAY requests no ad; no Reactor startup registration. Pause, Resume, Main Menu and Restart use separate reviewed placements and complete intended actions once. |
| HQA-THEME-001 — theme flash | Deferred application initialization allowed default-theme paint. No existing theme-flash finding ID was supplied/found in repository records. | Self-hosted, parser-blocking theme initializer before app/styles; shared resolver/application functions; explicit preference wins, then system; theme-color and color-scheme synchronized. CSP stays unchanged. Contract checks pass; subjective flash acceptance remains targeted Human QA. |
| Reactor DEV presentation | Inspector organization differed from Orbit; layout rules could override hidden state/launcher position. | Bottom-right launcher, independent overlay, STATUS / GAME / FIXTURES / TUNING / DEBUG / ADS tabs, preserved controls and test IDs. Opening inspector leaves board rectangle unchanged. |

## Interstitial law

The authoritative clock is RAM-only and begins when the website opens a game context. It is read from elapsed wall time, so background throttling does not need ticks to accumulate time. Initial iframe readiness preserves entry time; a real iframe reload creates a fresh context. Home/leave destroys the clock; re-entry starts fresh.

Only the provider's **SHOWN** callback for startup/interstitial resets the timer. Reset occurs at show time, not completion. Reward completion/skip/failure, request attempts, disabled/unavailable/no-fill, pre-show failure/timeouts, state transitions, visibility changes and run restarts leave it alone. `firstSeconds` migrates to `timerSeconds`; legacy interval, shared cooldown and resetAfterRewarded settings are discarded. Caps and per-placement restrictions retain separate safety history. DEV Make Interstitial Eligible changes only this clock and never displays an ad.

## Verification

Required check, QA-contract, monetization, portal, ads, Orbit, Orbit ads, Reactor and Reactor ads suites: **255 tests passed, 0 failed**. Production build and both release guards passed. Static-release verification needed ordinary localhost access because the sandbox denied its internal HTTP connection. No application dependency was added. Existing large Phaser chunk warnings remain.

Local browser used the launcher's exact session URL:
`http://127.0.0.1:5194/games/reactor-stack/?qa=0991ae29-0473-4624-bb34-7587e8772406`.
Portal and iframe had matching launcher build identity, version 0.2.1, mounted canvas and a connected mock renderer before testing. A first sandboxed launch could not reach localhost and was not used as browser evidence.

Both games were measured at 450×400, 500×400, 640×360, 720×400, 844×390, 932×430, 360×640, 390×844, 412×915, 1024×768, 1280×720 and 1920×1080. Player bottom stayed within viewport; canvases mounted; no fallback. Reactor's shortest 640×360 board grew from 85px during the initial verification to 177px after correcting compact-landscape selection.

At 390×844 Reactor board/heat/header/control rectangles were exactly equal across short → long → short hints, DEV open and depleted refill labels. Portrait bar stayed 44px; visual button surface is 30px (~32% smaller). Rotation retained run ID, board and move count. An actual browser mouse drag committed exactly one move. Physical Android is not claimed from desktop emulation.

Actual browser mock results completed for `reactor.pause-interstitial`, `reactor.resume-interstitial`, `reactor.menu-interstitial` and `reactor.restart-interstitial`, restoring paused, playing, menu and fresh-run states respectively. Orbit's generic rewarded presentation completed while its interstitial timer advanced from 180s to 212s and remained eligible; it granted no game reward. Deterministic host/game tests cover true run/reward ownership, all outcomes, missing safe events and duplicate/stale transitions.

Production artifact guard verifies Null provider and absence of DEV tools/mock presentations/QA namespace data, AdSense/H5 scripts or CMP activation. Preview/CI details and exact final commit are recorded in the final handoff after publication of this draft candidate.

Detailed local evidence is in the ignored `outputs/final-human-fixes-0.2.1/` folder. No raw account cookies, authentication tokens or private contact data are included.

## Targeted Human retest — only these 13 groups

Use the protected 0.2.1 Preview for visual/device checks; use the identified local QA session for mock-ad and DEV checks (production Preview deliberately contains no mock/DEV tools).

1. Stored dark reload: no light flash; explicit light also reloads correctly. Check a direct game, Privacy and Terms page.
2. Resize a desktop game page to approximately 450×400: header/actions visible, game playable, no viewport message.
3. Repeat at 640×360.
4. Reactor: change hint text; board and heat bar do not move or resize.
5. Reactor portrait buttons: visibly smaller/fixed; counts readable; touch targets remain practical.
6. Physical Android Reactor: valid drag makes one move; source/destination taps still work; invalid drag spends no move; interrupted gesture recovers.
7. Physical Android: rotate portrait ↔ landscape during a run; same run, no viewport error; drag coordinates remain correct.
8. Orbit local QA: game-open time in menu/pause/no interaction reaches the threshold; only approved PLAY/RESTART displays an eligible mock.
9. Rewarded ad completion and skip leave the interstitial clock intact.
10. Reactor local QA: make eligible separately before Pause, Resume, Main Menu and Restart; one mock, then exactly one intended action. Before threshold, actions continue without an ad.
11. Reactor: no startup ad, including when the DEV startup switch is enabled.
12. Initial Reactor button is PLAY and never requests an ad.
13. Reactor DEV: bottom-right launcher, overlay, six tabs; opening/closing it never changes board geometry.

No merge, production deploy, DNS changes, AdSense submission, CMP/H5 activation or GitHub Pages disabling is authorized by this candidate.
