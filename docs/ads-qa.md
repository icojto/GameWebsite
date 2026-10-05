# Odesos Ads v1.1 human QA

## Commands

```powershell
cd C:\Users\mlgjm\Desktop\GameWebsite
git switch codex/odesos-ads-v1-1-boundary-fix
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

## Development

1. Open the printed `/games/orbit-break/` URL and note the player rectangle.
2. Press Ctrl+Shift+A. Confirm the inspector opens without a dark backdrop; accessibility semantics are complementary/non-modal.
3. While it remains open, click Home/Games/About/Contact where visible, website controls and the uncovered game iframe. Only the drawer's own rectangle should intercept input.
4. Confirm player/iframe dimensions do not change and the page gains no horizontal overflow. Tab between website/game/panel controls; focus must not be trapped. Escape closes the panel and restores sensible focus.
5. Reopen. Overview must say `Presentation surface: GAME`, current game, and `Connected renderer: NO` / `Renderer ready: NO` before Prompt 3.
6. Confirm fresh Startup Enabled is OFF. TEST STARTUP should report disabled. Turn it ON, RESET STARTUP, then TEST STARTUP: no website courtesy/ad overlay; expect `unavailable (game-presentation-unavailable)`.
7. MAKE ELIGIBLE alone: no ad. SIMULATE SAFE EVENT: no website overlay and renderer-unavailable result. Preserve 180/180/180/3 defaults.
8. TEST REWARDED GENERIC: no website overlay; unavailable, reward qualified NO. Load/no-fill/unavailable outcomes should finish before presentation. Once Orbit connects, completed may qualify only after its shown+completed lifecycle.
9. Courtesy preview buttons should be disabled with `Game Ad Player not connected`. Configuration remains editable for the future renderer.
10. SHOW/HIDE MOCK BANNER. Confirm the banner remains website-level below action bar, outside the iframe, with no overflow.
11. Resize to about 360px. Confirm the non-modal bottom sheet remains usable; no backdrop intentionally disables the remaining page.
12. Review events for renderer-connected/unavailable, presentation-requested/ready, courtesy-started, ad-visual-started, terminal state and timeout as applicable.
13. Reload: v1.1 tuning persists; session observations reset. A legacy v1 configuration migrates without corruption and startup is forced OFF once.

After Prompt 3 supplies a temporary/real Orbit GameAdPlayer, repeat complete/close/fail/timeout and verify all visuals stay inside the iframe, pause/audio contract, duplicate rejection, cancellation, cooldown and reward acknowledgment.

## Production

1. Run build and preview. Open `/`, both public game pages and direct reloads.
2. Confirm no AD DEV trigger/panel, mock banner, website fullscreen overlay, courtesy runtime or mock adapter.
3. Ctrl+Shift+A does nothing. Orbit and Reactor start and play normally.
4. Homepage/footer show only two playable games; hidden game routes stay non-public while sources/builds remain preserved.
5. Inspect console/network for new errors and third-party traffic.

Human-only: physical Android/iPhone touch/audio, OS reduced motion, fullscreen/background transitions, assistive technology and long-session soak. Desktop emulation is not physical-device proof. The prior source-less MutationObserver browser error still requires attribution; do not claim a clean console until independently resolved.
