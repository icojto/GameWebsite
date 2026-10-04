# OdesosGames website production readiness v1

## Mission and preflight

Targeted portal engineering pass, not a redesign or game change. Branch `codex/odesos-website-production-readiness` started from `origin/main` at `f34fe0d47fd9faf943591fdd2db855e392ad5f50`. The remote is `icojto/GameWebsite`; main includes merged Reactor Stack PR #13 and Player V2. Orbit Break and Reactor Stack are the only public catalog entries; Games 003–005 remain on hold in source. No open PR blocked this branch. `package-lock.json` had a stat-only working-tree mark before edits, but its content hash matched the index; it was not staged.

The portal is a Vite/TypeScript SPA with catalog-driven cards and isolated game iframes. The generic Player V2 host owns loading, retry, action bar, dialog, and responsive frame; each game owns its internal layout and gameplay. GitHub Pages builds from `main` only. No new dependency was needed.

Confirmed findings in current code: stale “One game today” copy, direct site-level `localStorage`, legacy theme key, homepage's implicit first-game assumption, hidden mobile navigation below 900px, missing SPA focus management and `aria-current`, “Skip to games” wording, dialog focus return limited to explicit button, multiple anchors per game card, no About/Contact/footer trust structure, shared static title/description, no route canonicals/social metadata/structured data, no sitemap or robots, and no branded static 404. The old verifier checked assets and hidden routes but not SEO or structural portal behavior.

## Gate A — correctness, mobile, accessibility

- Replaced count-fragile homepage copy and added an empty-public-catalog fallback.
- Added a safe site storage helper for get/set/remove and one-time migration from valid `studioArcade.theme` to `odesos.theme`. Game-owned storage is unchanged. Local reactions remain local-only.
- Escaped catalog-sourced text in existing HTML templates. No renderer/framework rewrite.
- Preserved the four-link navigation on mobile as a compact second row with 44px minimum link/touch heights; removed the body minimum-width overflow at 320px.
- Added main-region focus after in-app navigation and browser Back/Forward, without moving focus on initial load. Active global navigation exposes `aria-current="page"`; skip-link wording is “Skip to main content.”
- Controls dialog restores trigger focus on its native `close` event, including Escape. The game card is now one clear link.
- At 320px, the player action bar stacks the title and 44px actions instead of truncating Reactor Stack. Footer and dialog controls have touch-sized targets.

## Gate B — discoverability

- Public route metadata is derived from the same catalog used by the portal: home, Orbit Break, Reactor Stack, About, Contact. Each direct-load HTML has a unique title, description, canonical, OG/Twitter tags, and the shared 1200×630 PNG social card. In-app SPA navigation updates the same head metadata and JSON-LD; unknown in-app routes are `noindex` with no stale canonical.
- Home gets factual `WebSite` JSON-LD; the two public games get factual `VideoGame` JSON-LD. No organization, ratings, release dates, or commercial claims were invented.
- Build generates `sitemap.xml` and `robots.txt` from public route metadata only. Games 003–005 are absent from both.
- Build generates a branded, script-free, `noindex` static `404.html` with responsive navigation, Home/Games links, and footer. Runtime SPA not-found behavior remains.

## Gate C — content, social asset, QA, release hygiene

- Added short factual About and Contact routes. Repository search did not find an approved OdesosGames public contact channel; the page does not invent one. A human-supplied channel is required before a later compliance/monetization submission.
- Footer groups public Games and Odesos pages. No dead legal links or fabricated entity details.
- Game pages retain their game-first Player V2 layout. Existing catalog-sourced description, type, orientation, browser support, and controls remain below the player. No game implementation or internal UI was edited.
- Added a 1200×630 PNG social card, editable SVG source, and dependency-free Windows raster script. The PNG is about 88 KB.
- Added native Node portal tests for visibility, route metadata, safe-storage fallback, and legacy theme migration. Expanded Pages verifier for every static route, unique metadata, canonical, OG/Twitter, JSON-LD JSON parsing, sitemap/robots, PNG dimensions, static 404, source-level a11y smoke, assets, and hidden-game protection. Pages workflow runs the portal tests on `main` before deployment.
- Updated README public/on-hold distinction, Windows launch commands, Game 006 instructions, and Pages documentation. Added a concise human release checklist.

## Gate D — production preview and responsive QA

Local Vite production preview at `127.0.0.1:4173` was inspected at widths 320, 360, 390, 412, 768, 1024, 1366, 1440, and 1920 CSS px (844px representative height) for home, both public game pages, About, and Contact. DOM geometry showed visible navigation, main and footer, nonzero game frames, and no page-level horizontal overflow. A 320px screenshot exposed a 15px overflow from `body { min-width: 320px; }`; the cause was fixed and visually rechecked. Reactor's 320px host action bar was similarly refined. The static 404 was checked at 320px with a valid main target and no horizontal overflow. The iframe's own mobile presentation remains game-owned.

Browser interaction smoke: Reactor embed loaded and its Initialize button started the board; Orbit embed loaded its menu/status. Controls dialog opened; Escape closed it and returned focus to Controls. In-app Contact navigation and browser Back focused the new main region with the expected active nav state. Physical Android/iPhone touch, sound, and subjective visual polish remain human QA.

Console caveat: the in-app browser logged a source-less `MutationObserver.observe` TypeError when either game iframe loaded. Fresh homepage and script-free 404 tabs did not log it; no `MutationObserver` call was found in portal, Orbit, or Reactor source. Both embeds continued to render/start. The source is not proven, so this is **not** called a clean-console pass; reproduce in a normal browser and attribute it before release sign-off. This pass does not change game internals.

## Validation and performance

- Baseline before edits: `npm.cmd run check`, `npm.cmd run build`, `npm.cmd run verify:pages` passed.
- Final after edits: `npm.cmd run check`, `npm.cmd run test:portal` (4/4), `npm.cmd run build`, `npm.cmd run verify:pages`, and `git diff --check` passed.
- Portal production output: JS 22.23 KB minified (6.87 KB gzip), CSS 21.56 KB minified (5.76 KB gzip); no framework or runtime dependency was added. Existing Phaser game chunks emit advisory >500 KB warnings. A precise same-tool baseline bundle delta was not measured.

## Boundaries and known limitations

Hidden game source/builds are preserved and their embed files may remain directly addressable in the Pages artifact; hiding is a public catalogue/routing/discoverability boundary, not access control. They are not linked, generated as public game pages, or included in sitemap. No public contact method exists yet. Full WCAG automation (for example axe/Playwright) was deferred because it would add an optional QA dependency. Cloudflare/security headers, legal policies, consent, analytics, backend, accounts, AdService, mock ads, Ad Dev Panel, ads.txt, CMP/TCF, and real Google ads were deliberately not implemented. Theme preference is applied by the deferred app module, so a brief pre-hydration theme flash remains possible; no inline script was introduced that would complicate future CSP.

## Human QA before merge

Use [the website release checklist](../website-release-checklist.md). In particular, inspect home and both game pages at desktop and 320/360/390/412 mobile; keyboard and skip-link flow; Controls close via button and Escape; Back/Forward focus; both themes; restricted storage; direct loads of all public routes; unknown route/404; sitemap/robots/head metadata; hidden-game absence; browser console; physical Android/iPhone touch and sound. Do not merge until the human visual gate is accepted. Merging to `main` would trigger Pages deployment, so this Draft PR must remain unmerged until explicit human approval.
