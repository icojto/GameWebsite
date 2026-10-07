# Website release checklist

Complete this before a human merges a website PR into `main`.

- [ ] `npm.cmd run check` passes.
- [ ] `npm.cmd run test:portal` passes.
- [ ] `npm.cmd run build` passes.
- [ ] `npm.cmd run verify:static-release` passes, including metadata, sitemap, robots, and assets.
- [ ] Mobile navigation and focus styling work at 320, 360, 390, and 412 CSS px.
- [ ] Keyboard navigation, skip link, controls dialog, Escape, and focus return work.
- [ ] Responsive shell and footer work from 320 to 1920 CSS px without horizontal overflow.
- [ ] Orbit Break and Reactor Stack are public and playable.
- [ ] Games 003–005 remain hidden from cards, pages, navigation, and sitemap.
- [ ] No DEV-only portal UI or console-breaking errors appear in production preview.
- [ ] Direct-load public routes and the static 404 work on the Cloudflare Worker Preview.
- [ ] Physical Android and iPhone touch, sound, and visual review are complete.
- [ ] Public contact method and later legal/consent requirements are reviewed before any monetization submission.

Main remains the future Workers production branch. Complete the Cloudflare branch Preview gate in docs/release/cloudflare-workers-static.md before merge. This checklist is not permission to merge or change the domain automatically.
