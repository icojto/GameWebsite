# Ad blueprint v1 — human QA gate

MOCK ONLY. No game-specific pausing/rewards are connected yet. Do not interpret a simulated completion as a real reward grant or provider approval.

## Windows commands

```powershell
cd C:\Users\mlgjm\Desktop\GameWebsite
git switch codex/odesos-monetization-blueprint-v1
npm.cmd ci
npm.cmd run check
npm.cmd run test:ads
npm.cmd run test:portal
npm.cmd run test:orbit
npm.cmd run test:reactor
npm.cmd run build
npm.cmd run verify:ads-production
npm.cmd run verify:pages
npm.cmd run dev
```

Use the printed localhost port. A second terminal can run `npm.cmd run preview` for production on its separately printed port. Do not publish the dev server. Build/verification never deploy; a human merge to main would trigger the existing Pages workflow.

## Development checklist

1. Open `/games/orbit-break/` through the website dev server, not `dev:orbit` or the standalone embed URL.
2. Press Ctrl+Shift+A. Confirm **ODESOS AD DEV** opens outside the iframe. Repeat using AD DEV.
3. Close with Escape. Confirm focus returns sensibly and the game's rectangle did not resize. Also try the shortcut while the iframe is focused. Ctrl+Shift+D remains game-owned.
4. RESET DEFAULTS, RESET STARTUP. TEST STARTUP with Complete. Expect readiness → courtesy → obvious MOCK AD/countdown → completed. Startup requested/shown/completed all YES.
5. Repeat without reset. Expect startup-once-per-session blocking. Disable once/session for deliberate repeated testing, then restore it.
6. RESET STARTUP. Select Next result = No fill, TEST STARTUP. Expect no courtesy/ad and no reward. Repeat with Load error, Timeout and Unavailable, resetting startup each time.
7. Confirm Next result returns to Complete after consumption. Set a numeric duration by typing, then blur the input; confirm it affects the next test.
8. Preview STARTUP, INTERSTITIAL and REWARDED courtesy states. Check distinct neutral wording, chibi eyes/blush/sweat drop and Cancel/Escape. No reward should be granted.
9. Toggle Mascot and Animation. Set the operating system/browser to reduced motion; confirm static mascot and no motion dependency. Test both Friendly/Concise presets and the 400/2500 ms bounds.
10. Simulate game state = playing. Confirm active seconds rise. Menu, paused and game-over stop the clock. Background the tab during playing, return and confirm the hidden interval was excluded. This dropdown does not manipulate the real game.
11. RESET COOLDOWN, MAKE ELIGIBLE. Confirm **Eligible YES**, but no ad appears while waiting.
12. SIMULATE SAFE EVENT. Expect one interstitial. RESET/MAKE ELIGIBLE alone must never show it.
13. MAKE ELIGIBLE again and simulate safe event. Expect cooldown blocking. Reset cooldown to test again.
14. Set short interval/cooldown and maximum/session = 1 in a fresh page session; show one interstitial, make eligible and trigger again. Expect session cap. Reload resets session counters.
15. FORCE INTERSTITIAL is explicitly an eligibility bypass for DEV only, not a game integration. Verify another active request still blocks it.
16. TEST REWARDED GENERIC / Complete. Expect reward qualified YES and **No game reward applied**.
17. Repeat Close early, and separately press Escape or Close early during an ad. Expect closed, qualified NO. Test No fill, Load error, Timeout and Unavailable: all NO.
18. After a shown rewarded ad, MAKE ELIGIBLE and simulate safe event. Expect cooldown under the default reset-after-rewarded setting.
19. SHOW MOCK BANNER. Close the panel. Confirm it is below the action bar, above game information, outside the iframe and not overlapping controls. HIDE MOCK BANNER removes it; repeated Show while visible does not add impressions.
20. Resize to 360px wide. Check near-fullscreen bottom sheet, internal scrolling, readable inputs, visible Close control, banner fit and no horizontal page overflow. Repeat landscape and fullscreen transitions.
21. Review Events for request, ready, courtesy, shown, result and cooldown ordering, plus placement/game context. Stats are local session observations only.
22. CLEAR SESSION STATS. Observations clear, but caps/cooldown/startup safeguards remain. No duplicate reward acknowledgment becomes valid again.
23. Change tuning and reload. Confirm configuration persists, statistics reset and game state is unknown until reported/simulated. RESET DEFAULTS restores tuning. Restricted storage must not break the portal.
24. Navigate between games and Home during preparation/showing. Confirm cancellation, no orphan overlay, no previous iframe result and no stacked shortcut handlers. Homepage creates no game iframe.
25. Repeat core flows on Reactor's page. No game-specific reward, gameplay tuning or provider code should have been added to either game.

## Production checklist

1. Run build and all verifiers, then preview. Open `/`, `/games/orbit-break/`, `/games/reactor-stack/` directly and reload each.
2. Verify NO AD DEV button, NO Ctrl+Shift+A response, NO panel, NO mock overlay, NO banner and NO automatic courtesy screen, including after setting dev preferences on the development origin.
3. Start an Orbit run, reverse direction, pause/resume and restart. Confirm normal local progress and no ad interruption.
4. Start Reactor, move/merge cells, pause/resume, use controls and restart. Confirm no ad interruption.
5. Homepage/footer show only Orbit Break and Reactor Stack and **2 playable games**. `/games/last-relay/` is not a normal public game page. Hidden games' repository source and embed builds remain preserved (hiding is not access control).
6. Check browser console and network for new errors, failed assets and unexpected third-party traffic. Do not dismiss the source-less MutationObserver error as resolved without reproducing/attributing it in an ordinary browser.
7. Test physical Android/iPhone touch, sound, scrolling, safe areas, focus, browser back/forward, background/resume and fullscreen. Desktop viewport emulation is not device proof.

## Evidence from this implementation run (2026-10-05)

- Automated service/bridge/Null tests and existing portal/Orbit/Reactor tests pass. Active-time, deadlines, concurrency, cooldown, caps and reward qualification have deterministic native test coverage.
- Browser tested: shortcut open/Escape close, website ownership and unchanged iframe rectangle; startup Complete/No fill/Error; three courtesy copies and original mascot; eligibility with no automatic interruption and safe-event completion; rewarded Complete/early close/Escape/No fill; banner show/hide; 360×800 sheet/banner without overflow; settings persistence via keyboard edit/reload; reset defaults and clear statistics.
- Production browser tested: no ad tooling nodes, hidden banner, no shortcut response, Orbit started and score advanced, Reactor started and a move incremented Moves to 1/heat to 4%, two-game homepage with zero iframes, hidden Last Relay page rejected.
- Not completed by automation: physical touch/audio, OS reduced-motion visual check, exhaustive fullscreen/background/assistive-technology QA and long-session soak. These remain human gates.
- Console caveat: the in-app browser records `MutationObserver.observe: parameter 1 is not of type Node` without a source URL. No MutationObserver usage was found in portal/current public-game source. Attribution remains unresolved; a clean-console claim is not made.
