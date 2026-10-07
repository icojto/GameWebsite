# Third-party register v1

Production evidence: live homepage and both public game pages, source/deployment workflow, DNS and successful HTTPS response. Main deployed revision ef6694e42cb76e018c6702ff8937316ac625d2d2; build f68adbde-107e-4b7f-9d71-c58a7a3d512e. Asset snapshots show same-origin portal/game JS, CSS and images. This is a bounded loaded-asset inventory, not complete packet capture of every conditional request.

| Provider/origin | Actual role / state | Evidence / unresolved facts |
|---|---|---|
| odesosgames.com | Own-origin static portal and game assets | Portal JS index-BOgPhKpY.js; actual game readiness shown in DOM; local fonts use system stack |
| GitHub Pages | Origin hosting behind proxy | pages.yml deployment and x-github response headers; visitor IP security logging documented; contracts/retention/transfers require human review |
| Cloudflare | Active DNS/proxy edge | A 104.21.1.8 / 172.67.151.184, Cloudflare nameservers and Server header; plan/rules/security settings unknown |
| a.nel.cloudflare.com | Conditional browser network-error reporting endpoint | Report-To/NEL advertised; no POST observed; not an independently installed analytics SDK |
| Google advertising/CMP | Future provider, NOT ACTIVE | No SDK/tag/public ID observed in source or bounded assets; do not claim current Google visitor data collection |
| Playgama | Secondary inquiry, NOT ACTIVE | No SDK/client ID; no dual provider activation |
| Mailbox provider | UNKNOWN | MX query returned SOA only; neither delivery nor inbox configuration established |
| OpenAI | Development tooling only | No production visitor API call observed; not a current visitor-data recipient |
| schema.org | JSON-LD vocabulary only | Not a network request just because URL appears in structured metadata |

Public routes: /, /games/orbit-break/, /games/reactor-stack/, /about/, /contact/. Unknown paths display safe 404 UI. Privacy and Terms are absent. Footer currently links only About/Contact and games. Three unlisted game embeds remain built/public at their exact embed URLs; hiding a catalog card is not access control. No accounts, purchase backend, newsletter, UGC API, analytics SDK or visitor AI exists in audited v1 source.

Read source register H01–H07 before making privacy claims. Hosting commercial-use scope is unresolved: [GitHub Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits). Obtain written clarification or suitable hosting before monetization.
