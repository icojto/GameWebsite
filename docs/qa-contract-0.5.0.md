# QA contract 0.5.0

Extends [0.4.1](qa-contract-0.4.1.md). Storage namespace, read-only inspection, confirmation ownership, fixtures, allowed semantic events and production separation are unchanged. Launch fresh qa:dev; use its exact printed URL. After source/commit changes restart the launcher. Actual browser canvas/bridge readiness is a separate required gate from shell HTTP.

## MVP VIEW

The non-modal website AD DEV inspector shows provider/game/renderer/state/result, active time, fullscreen safety shown count, eligibility and actual block reason. It has Ads Enabled/Startup/Interstitial/Rewarded/Banner, first wait/cooldown, Unlimited plus disabled finite value, normal tests, timing-only Make Interstitial Eligible and independent Clear Cooldown. Outcomes are one-shot; Abort is QA cancellation. Rewarded placement/run diagnostics require an actual game run context; generic preview cannot invent one or apply a reward. Last eight events are concise, no raw payloads. Status describes policy/capability; it does not promise provider fill.

Clear Stats and Clear Session Stats are explicit observation-scope aliases. They retain safety shown history, cooldowns, run ceilings and reward receipts. Reset Defaults restores global ad defaults only; saves and session-only placement tuning/history remain.

Help content stays attached to fields/actions through hover/focus and accessible descriptions; repeated MVP visual icons are hidden. Section status help is visible. Escape dismisses help before closing the panel. Refresh never focuses a control or overwrites the active input. Use actual keyboard editing/change commit for numeric controls. Panel does not remount/resize the iframe or trap the entire page.

## ADVANCED QA

One details section is closed by default. Expanding it preserves placement/session/run counters and tuning, approved safe-event selection, Test safe transition (normal policy), Force mock interstitial — bypass policy (explicit DEV bypass), restart wait, startup reset, detailed rewarded limits, all courtesy/mascot/animation/preset/duration toggles, simulated reported state, mock timings/watchdog, provider/renderer/bridge data, full JSON events/stats/config/snapshots and migration choice when required. Safe events remain an allowlist, never arbitrary editable text. Force is presentation evidence only, never normal PLAY/RESTART proof.

View Full Log expands Advanced and its Events subsection and focuses its summary. Hidden engineering controls are not duplicate clones of the MVP controls.

## Selectors and migration

Prefer scoped role/name with exact=true where a similarly named Help button exists.

| Old website label | New visible label / selector |
| --- | --- |
| Ads master | Ads Enabled; `ad-config-master` |
| Enabled (default OFF) / type Enabled | Startup / Interstitial / Rewarded / Banner; `ad-config-<type>-enabled` |
| First eligible after active seconds | First eligible after (seconds); `ad-config-interstitial-firstSeconds` |
| Cooldown seconds | Cooldown (seconds); `ad-config-interstitial-cooldownSeconds` |
| Limit interstitials per session | Inverse `Unlimited interstitials`; `ad-session-unlimited` (checked means limit OFF) |
| Maximum per session | Finite session limit; `ad-config-interstitial-maxPerSession` (disabled while Unlimited) |
| Satisfy playtime requirement | Make Interstitial Eligible; `ad-make-interstitial-eligible` |
| Clear interstitial cooldown | Clear Cooldown; `ad-clear-cooldown` |
| TEST STARTUP / TEST REWARDED GENERIC | Test Startup / Test Rewarded; `ad-test-startup` / `ad-test-rewarded` |
| Test safe transition | Retained in Advanced; new MVP Test Interstitial uses the same NORMAL policy and approved event |
| SHOW/HIDE MOCK BANNER | One Show Banner/Hide Banner toggle; `ad-show-banner` stable ID |
| RESET DEFAULTS / CLEAR SESSION STATS | Reset Defaults / Clear Session Stats; `ad-reset-defaults` / `ad-clear-session-stats` |

Containers/readouts: `ad-dev-mvp`, `ad-dev-advanced`, `ad-recent-events`, `ad-reward-status`. New outcome buttons use `ad-complete`, `ad-skip-no-reward`, `ad-no-fill`, `ad-timeout`, `ad-error`, `ad-abort-qa-presentation`. Existing game/QA fixture/snapshot selectors from 0.4.1 remain.

## Responsive and terminal ownership

Host allocation uses viewport minus measured actions/allowance and keeps the same iframe source across resize. Minimum game frame is 240×280 CSS pixels; below it a blocking explanatory overlay holds the run without replacing its identity or inventory. Page scrolling to the player is allowed; gameplay documents remain contained. Modal/panel scrolling is intentional. Required viewport matrix and physical gate are in the dated patch.

Reactor uses one native captured Pointer Events path for mouse/touch/pen, with passive=false on board down/move/up only; tap pair and drag share Gesture/TurnController and current canvas coordinates. Cancel/lost capture/blur clears safely. Android certification requires actual hardware.

Orbit background input is accepted only in menu/playing, never terminal/pause or pending/dialog/ad/fallback ownership. Terminal backdrop captures pointer input; explicit buttons work. Dialog close restores visible prior focus or the terminal/menu start control.

## Evidence and release metrics

Human record stays 332 total / 316 Pass / 8 Fail / 8 N/A until required post-merge/deploy/hardware evidence succeeds. Applicable = total - N/A; pass rate = Pass / Applicable; completion = (Pass + Fail) / Applicable. Completion 100% with failures does not mean release-ready. Release additionally requires zero Fail/Blocked/Pending, every applicable Pass, zero open applicable S0/S1 and completed targeted retests. V2-003 Deferred/N/A and other approved exceptions remain visible.

No automatic merge/deploy, real provider approval, legal compliance, monetization acceptance or owner approval follows from this patch.
