# Remaining targeted human / post-deploy queue — Stage 1

No original Fail or linked defect is closed by this patch. Merge/deploy is Hristo's decision. Supply the deployed revision, device/browser/OS, steps, actual result and evidence for each check in this chat.

1. Real Android Reactor tap pair + valid drag, invalid drag, cancellation, no scrolling/duplicate move and coordinates after rotation — REA-024 / MOB-027 / HQA-002.
2. Real Android portrait/landscape and short-height recovery; Pause/Cool/Upgrade reachable, board square, run/board/inventory/pending/Pause preserved — REA-022 / MOB-027 / MOB-033 / V2-004 / HQA-003.
3. LIVE Reactor compact header/instructions and controls — REA-022 / HQA-001.
4. LIVE Orbit terminal empty backdrop mouse/touch/keyboard isolation; explicit result controls, QUESTS/X/Escape focus restoration — ORB-012 / HQA-004.
5. Fresh LOCAL DEV qa:dev exact printed URL, Startup OFF, Connected renderer, timing-only Make Eligible then real PLAY; record placement/reason/counters and one new run — OAD-005 / HQA-005.
6. Fresh LOCAL DEV normal RESTART after one terminal completion; Make Eligible, inspect/clear independent cooldown for QA if needed; one safe event/opportunity and fresh UUID — OAD-006 / HQA-005.
7. Reactor Powers Depleted → Force Fail → close DEV → Reinitialize → Pause → Main Menu; INITIALIZE/Heat 0 and one completed history entry — RAD-011 / FAI-001.

Exact remaining Fail IDs: ORB-012, REA-022, REA-024, OAD-005, OAD-006, RAD-011, MOB-027, MOB-033.
Exact open applicable defects: V2-004, FAI-001, HQA-001, HQA-002, HQA-003, HQA-004, HQA-005.
N/A retained: ORB-009, REA-021, OAD-022, RAD-021, RAD-024, DEV-027, DEV-045, MOB-028. V2-003 stays Deferred/N/A; historical closed defects stay closed.

Stage 2 only after all required successful evidence: create OdesosGames_Full_QA_FINAL_PRODUCT_PASS.xlsx; update linked affected rows and defect closure honestly. Current counts remain 332 / 316 Pass / 8 Fail / 8 N/A, applicable 324, pass 97.53%, completion 100%, technical gate NOT READY.
