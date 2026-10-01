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
