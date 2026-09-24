# Mobile game repair — 2026-09-24

## Device report

The site owner confirmed Orbit Break works on their phone in portrait and landscape. Reactor Stack, Station Quartermaster, and Signal Below required scrolling inside the iframe to reach content. Last Relay was blocked in portrait unless the browser requested the desktop site. All four had problems in landscape. The earlier integration's browser viewport pass was unavailable; build and route checks alone did not establish mobile acceptance.

## Changes on this review branch

- For Games 002–005, the portal measures the same-origin iframe document and lets the outer page scroll when the screen is narrow or short. A content resize and phone orientation change trigger a new measurement. Orbit Break keeps its existing working frame behavior.
- Last Relay no longer puts a rotate-to-landscape panel over portrait play or pauses simply because the screen is portrait. Its header, lane targets, controls, and start/pause overlay have a compact portrait layout. The original desktop and landscape rules remain in place.

## Validation and remaining gate

- `npm run check` and `npm run build` passed after the repair.
- GitHub Pages production build and `npm run verify:pages` passed: all five direct routes, embeds, linked assets, and Signal Below scene assets resolved.
- A real browser/mobile viewport interaction pass is still required. The local preview could not be reached by this environment's browser, and no physical phone was available here. Test each game on a phone in both orientations: start, core touch actions, navigation, modal/menu, outcome, and restart. For Games 002, 004, and 005, scrolling the **page** is expected; the iframe itself must not trap vertical swipes or hide actions. In Last Relay portrait, verify all three lanes and purchase/launch/pause remain tappable. Record device, browser, and any remaining failure on the PR before merging.

To control cost and quality going forward, accept one game per review cycle after desktop, phone portrait, and phone landscape gameplay checks. Treat this branch as a repair candidate until the device gate passes. GitHub Pages deploys only after a reviewed merge to `main`.
