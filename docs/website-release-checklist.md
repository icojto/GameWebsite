# Website release checklist

Complete this before a human merges a website PR into `main`.

- [ ] `npm.cmd run check` passes.
- [ ] `npm.cmd run test:portal` passes.
- [ ] `npm.cmd run build` passes.
- [ ] `npm.cmd run verify:pages` passes, including metadata, sitemap, robots, and assets.
- [ ] Mobile navigation and focus styling work at 320, 360, 390, and 412 CSS px.
- [ ] Keyboard navigation, skip link, controls dialog, Escape, and focus return work.
- [ ] Responsive shell and footer work from 320 to 1920 CSS px without horizontal overflow.
- [ ] Orbit Break and Reactor Stack are public and playable.
- [ ] Games 003–005 remain hidden from cards, pages, navigation, and sitemap.
- [ ] No DEV-only portal UI or console-breaking errors appear in production preview.
- [ ] Direct-load public routes and the static 404 work on GitHub Pages.
- [ ] Physical Android and iPhone touch, sound, and visual review are complete.
- [ ] Public contact method and later legal/consent requirements are reviewed before any monetization submission.

Merging to `main` triggers Pages deployment; this checklist is not permission to merge automatically.
