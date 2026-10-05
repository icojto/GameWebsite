# Ad DEV controls — Patch 03.1

MOCK ONLY. Provider compliance not reviewed. Website owns policy/diagnostics/banner; each game owns fullscreen presentation, suspension and rewards. No Reactor integration in this patch.

## Five interstitial actions

| Button | Exact effect | Does not do |
| --- | --- | --- |
| Satisfy playtime requirement | MAKE ELIGIBLE: next threshold = current active time; ignored with feedback while busy | Show an ad, clear cooldown/caps, invent a safe event |
| Restart playtime wait | RESET ELIGIBILITY TIMER: current active time + configured firstSeconds | Erase active time, restart the game, reset counts/cooldown |
| Clear interstitial cooldown | RESET COOLDOWN: clears shared interstitial timer | Satisfy playtime, remove placement cooldown/caps, show an ad |
| Test safe transition | Selected reviewed current-game event through DEV identity and normal policy | Press real PLAY/RESTART, end a run, grant rewards, edit real allowlists |
| Force mock interstitial — bypass policy | DEV presentation test bypasses interstitial timing, safe-event, type switch and global cap | Bypass master, context/placement restrictions, visibility, concurrency, provider/renderer, bridge validation |

Courtesy PREVIEW buttons run request/presentation flows and may affect observations and safety history, not just screenshots. Interstitial preview uses Force; startup/rewarded use normal policy. Generic preview never grants gameplay reward. Test actual game buttons separately.

## Limits and persistence

Global Limit interstitials per session OFF = Unlimited; ON enforces numeric maximum (zero blocks). Both Orbit interstitials and DEV interstitial placements default Unlimited too. No hidden 100-ad limit. Timers, safe events and concurrency remain enforced. Startup/rewarded rules are unchanged; revive keeps one shown attempt/run.

Old numeric settings get a non-modal one-time choice; until chosen their finite behavior remains. Use new default changes only this cap. Keep my existing limit explicitly enables it. Global config uses safe browser storage `odesos.dev.ads.v1.1`; placement edits are session-only. RESET DEFAULTS restores global defaults, not game saves, placement edits or safety history. CLEAR SESSION STATS clears observations/last results/events, not startup usage, safety counts, cooldowns, run caps or reward receipts. The 2,000-request/replay safety budget is retained independently of frequency policy; the event log is bounded to 200 entries.

## Results, help and cancellation

Current OFF/UNAVAILABLE/WAITING/ELIGIBLE is recalculated; READY belongs to an actually prepared request, COURTESY/SHOWING to its lifecycle. Last result persists separately. Placement restrictions explain disabled/capped/cooling placements. Observations are this browser/page only; generic reward-qualified previews are not game reward acknowledgments. Banner reports visible/hidden/unavailable and observed displays, never completed videos or certified impressions.

Startup/interstitial mock countdowns cannot be player-skipped. Rewarded Skip — no reward reports confirmed SKIPPED; other closes are CLOSED/CANCELLED. Abort current mock — QA only cancels safely without reward and retains already-shown safety history. No mock rule controls a future real SDK's required close/skip UI.

Every website editable field/action and grouped status section has contextual help; every Orbit Ads Integration entry has game-local help. Hover waits briefly; focus opens; ? taps pin/unpin; outside tap dismisses. Escape dismisses help first. Disabled controls retain a separate ? trigger. Numeric help derives defaults/ranges from configuration. Website Ctrl+Shift+A and Orbit Ctrl+Shift+D remain separate. No backdrop, player resize, focus trap or cross-frame help ownership is introduced.

Prompt 4 should reuse cap semantics, status/help conventions and type-specific mock skipping, not copy Orbit's reward/run rules.
