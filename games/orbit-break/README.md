# Orbit Break v2

This is the portal-owned Orbit Break game source. It began as an integration snapshot of the original game at `751f772fb18cfb59bd623fa5d3c262e915b0f8ca`; v2 is developed here. The separate original repository is unchanged.

The root `package.json` owns dependencies. From the portal root on Windows:

```powershell
npm.cmd ci
npm.cmd run dev:orbit
npm.cmd run test:orbit
npm.cmd run check
npm.cmd run build
npm.cmd run verify:pages
```

`dev:orbit` serves the standalone game at the printed local URL. The portal build embeds it at `/games/orbit-break/embed/` inside the existing player viewport. Space, canvas click, or tap starts/reverses/restarts; UI buttons are separate from the one-action gameplay input. The DEV panel appears only in development mode; use its DEV button or Ctrl+Shift+D. It never writes tuning or session logs to storage. The player profile is browser-local under `orbitBreak.profile.v2`, with best-score migration from `orbitBreak.bestScore`.

## Monetization v1 (mock integration only)

Use **`npm.cmd run dev` from the portal root**, then `/games/orbit-break/`, for ad QA. The existing Vite middleware serves Orbit's DEV source inside the actual host iframe. `dev:orbit` intentionally has no parent AdService and remains playable without ads. Production still builds the isolated embed and uses Null: no mock graphics, dead revive CTA, Why Ads, or developer tools.

PLAY/Space/canvas click/tap share one start path; RESTART uses the same locked flow. Optional startup (global default OFF) takes precedence over PLAY interstitial. Ads never interrupt a live run just because the host timer becomes eligible. Death offers one optional rewarded revive for eight seconds when available. Completing it preserves the run; closing a shown ad consumes that attempt. A pre-show failure offers at least three seconds to choose again. Restart/menu/expiry permanently records the run once.

The website owns policy/providers/timing. `src/ads/OrbitAdClient.ts` is transport and lifecycle, `GameAdPlayer.ts` is presentation-only, and `OrbitAdFlow.ts` owns game decisions. See [the architecture](../../docs/ads-blueprint.md), [QA procedure](../../docs/ads-qa.md), and [patch handoff](../../docs/patches/2026-10-05-orbit-monetization-v1.md).

Ctrl+Shift+A opens website Ad Dev. Ctrl+Shift+D opens Orbit DEV, including **Ads Integration**. Game-side controls never tune host ad eligibility/cooldown. Production verification:

```powershell
npm.cmd run test:orbit-ads
npm.cmd run check
npm.cmd run build
npm.cmd run verify:pages
npm.cmd run preview
```

No real provider, advertising revenue, SDK/network integration, analytics, CMP or legal/compliance approval is included. Physical-device touch/audio and long-session testing remain human QA.
