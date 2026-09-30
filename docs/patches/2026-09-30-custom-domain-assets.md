# Custom-domain asset paths — 2026-09-30

## Cause

The live `https://odesosgames.com/` HTML loaded but referenced `/GameWebsite/assets/...`. Those CSS and JavaScript URLs returned 404 at the custom-domain root, leaving only the unstyled skip link. The Pages workflow still set `GITHUB_PAGES=true`, which selected the old project-site prefix in both the portal Vite config and nested game builds.

## Fix

- Build the portal and all five game embeds with root-relative paths for the configured custom domain.
- Stop setting the obsolete Pages environment flag in the main-only deployment workflow.
- Verify the production artifact as a root-hosted static site and reject stale `/GameWebsite/` HTML links.
- Update the README with the current URL and publication requirements.

GitHub Pages is configured with `odesosgames.com` and GitHub Actions publishing. The old `https://icojto.github.io/GameWebsite/` URL redirects to the custom-domain root. For Actions publishing, the Pages custom-domain setting is authoritative; a repository `CNAME` file is ignored, so none was added.

## Validation

- `npm.cmd run check` — passed for the portal and all five games.
- `npm.cmd run build` — passed for the portal and all five embeds. Vite emitted advisory >500 kB Phaser chunk warnings.
- `npm.cmd run verify:pages` — passed for the root homepage, all five direct routes and embeds, their linked assets, and four Signal Below SVG scenes.
- Inspected generated HTML and scanned built HTML, JavaScript, CSS, and SVG: portal assets start at `/assets/`, game assets at `/games/<slug>/embed/`; no `/GameWebsite/` paths remain.
- The deployed site remains broken until this PR is merged and the main-only Pages workflow completes. No merge or deployment was performed here.

## After merge

Confirm the **Deploy GitHub Pages** run succeeds. Open `https://odesosgames.com/` and all five game routes, refresh a direct game URL, and check browser network/console plus touch and sound on physical devices. In Settings → Pages, retain the custom domain and consider enabling **Enforce HTTPS** once its certificate is active; the certificate was approved at inspection, but HTTPS enforcement was off.
