> Privacy correction (2026-10-07): historical residential-contact publication and related legal identity Pass claims are withdrawn. Current public disclosure is OdesosGames / Hristo Aleksiev, an individual in Bulgaria / contact@odesosgames.com. Public address and business telephone are BLOCKED pending qualified confirmation and lawful safe values. LEG-001, LEG-003-C and G2-LEG-001 are Blocked. This does not assert that minimal disclosure satisfies Bulgarian law. The old Preview was deleted; fresh sanitized verification is recorded in the privacy report.

# Cloudflare branch Preview verification

7 October 2026. Website 0.2.0. Existing Draft PR [#23](https://github.com/icojto/GameWebsite/pull/23).

## Result

CLOUDFLARE PREVIEW VERIFIED. Await Hristo before merging or switching production hosting. No production, DNS, email-routing, custom-domain, CMP, Google, ad or analytics activation was performed.

Preview: https://codex-prompt5-gate2-release-0-2-0-gamewebsite.icojto.workers.dev

Immutable tested deployment: https://6829e410-gamewebsite.icojto.workers.dev

Branch: codex/prompt5-gate2-release-0.2.0. Tested configuration/product revision: 5653525561f55c006b43b0394c7ba3a835a91965. Clean production build identity: fb2826a6-f500-4099-ae3a-16d77df52285, version 0.2.0, dirty false. Deployment identifier displayed by Cloudflare: 6829e410. Preview resource: 1f98e85ca04a40daa272a8ca710aec0f. Successful build: 553b239c-4513-47c8-82c1-f7220700dd94, 07:07:09–07:08:11 Europe/Sofia. Build/deploy completed successfully in 63 seconds. Node 24.21.0, npm 10.9.2, Wrangler 4.148.0. GitHub CI passed: https://github.com/icojto/GameWebsite/actions/runs/37569920978.

Any subsequent documentation-only checkpoint will be recorded with its own current head/build identity in the final evidence manifest; it does not replace this historical deployment evidence.

## Account and build configuration

Human completed Cloudflare login. Correct Worker gamewebsite connects to icojto/GameWebsite, production branch main, branch Preview builds enabled, root /, npm run build, npx wrangler preview. No application build/runtime variables, secrets or bindings. Managed Git build token reused; no manual API token created. Preview URLs enabled; production workers.dev URL remains disabled and no custom domains/routes were added. Ordinary Preview is public without Cloudflare Access. Preview logs/traces remain disabled.

## Demonstrated repair

Build befc95cd-08ac-4ac5-ba06-1ae9f6ac1db8 built 57af984 successfully, then Wrangler rejected deployment because the required previews block was missing. Classification: REPOSITORY CONFIG / WRANGLER. Read the complete rendered log across overlapping virtualized ranges, saved in build-befc95cd-dom-chunks.txt and build-befc95cd-failed.log. Copy/download exports did not return usable data; those attempts were not repeated.

Commit 5653525 adds an explicit empty previews block, keeps static assets and compatibility settings at the top level, and makes the existing static-release verifier reject the omission. No Worker script/backend or production route was added. Fresh build, static-release verifier, ad production boundary and Wrangler deploy dry-run passed. Cloudflare's automatic Git build/deploy then passed. This is one corrective build after new evidence, not a blind retry.

Official configuration: https://developers.cloudflare.com/workers/previews/configuration/. Static-only Workers use an empty previews block and keep assets at the top level.

## Actual browser QA

| Case | Result / evidence |
|---|---|
| Home / | Loads; visible Website 0.2.0, two public games; meta identity matches 5653525 clean production build |
| About /about/ | Navigation works; approved public operator and locality visible |
| Contact /contact/ | contact@odesosgames.com visible; exact mailto:contact@odesosgames.com target |
| Privacy /privacy/ | Readable notice; Hristo Aleksiev, public address — pending lawful safe value and approved contact facts present |
| Terms /terms/ | Readable free-game Terms; Privacy navigation and footer work |
| Privacy settings | Dialog opens; explicitly says advertising privacy controls are inactive and no advertising consent choice is recorded |
| Clear Local Data | Confirmation opens, explains scope; Cancel removes confirmation; no destructive confirmation used |
| Orbit /games/orbit-break/ | Menu renders; canvas present; PLAY starts a run, score increases and Pause appears; no visible DEV panel |
| Reactor /games/reactor-stack/ | Menu renders; canvas present; INITIALIZE REACTOR starts board and enables game controls; no visible DEV panel |
| Unknown path /a-path-that-does-not-exist-qa-check | Fresh navigation and reload show custom OdesosGames 404, Website 0.2.0 and working footer privacy control; actual navigation response HTTP 404 |

Saved DOM/build identities: browser-evidence.json. Game screenshots: orbit-start.png and reactor-start.png. Captured game/portal warning/error log: zero.

## Actual HTTPS responses

22 route/header/redirect/embed/asset checks passed using Sec-Fetch-Mode: navigate to match actual browser navigation. Seven public page routes return 200; unknown route returns branded HTML 404. Six slashless public routes return 307 with correct trailing slash. Both embeds, robots and sitemap return 200. _headers is not served as an asset. Unlisted game portal paths return 404.

Navigation HTML carries X-Content-Type-Options: nosniff; Referrer-Policy: strict-origin-when-cross-origin; Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=(); Strict-Transport-Security: max-age=31536000; measured self-only Content-Security-Policy; X-Frame-Options: SAMEORIGIN. X-Robots-Tag: noindex also present. These policies did not break the tested same-origin games or controls.

Evidence: preview-http.json, 404-navigation-headers.txt, 404-navigation-body.html. Important retained qualification: a generic non-navigation request, including Accept: text/html without navigation mode, returned plain HTTP 404 without custom security headers. Those observations are retained in preview-http-generic-accept.json. Initial checks stopped on this difference; browser navigation and matching response inspection resolved the apparent routing defect. No speculative routing patch was made. Cloudflare documents navigation behavior at https://developers.cloudflare.com/workers/static-assets/routing/static-site-generation/.

## Network and tracking scope

Observed page assets and portal/game script elements are same-origin. No active Google Ads/H5/Analytics, Playgama, visitor OpenAI API, Zaraz or Cloudflare Web Analytics SDK/injection was observed. Actual Preview portal and game scripts are the expected built assets. Repository production guard separately passed for 37 artifacts and Null provider. No unexpected third-party application asset was observed.

Cloudflare adds NEL/Report-To security/network error reporting headers pointing to a.nel.cloudflare.com. These are platform reporting, not an application advertising/analytics SDK. Privacy notice already discloses this possibility. The available browser inventory is not a full request/response, storage or cookie capture. PRI-003-R retains its human DevTools inspection dependency; no claim of complete packet/cookie certification.

## Workbook reconciliation and remaining queues

Output: OdesosGames_Monetization_Compliance_QA_v1.1.xlsx. Before and after: 75 records, 38 Pass / 2 Fail / 34 Blocked / 1 N/A / zero Not run. No case status changed. No new case IDs added to inflate the denominator.

Evidence updated for SEC-002, SEC-003, SEC-005, SEC-006, NET-003, G2-HOST-001, G2-SEC-001. Preview portions are now verified; mixed LIVE/custom-domain/provider requirements stay open. Original Gate 2 cell snapshot: workbook-before.json. Gate 1 History and original Desktop input remain preserved. Historical evidence is retained, not rewritten as a prior Pass.

Exact queues remain in PROMPT5_GATE2_REMAINING_QUEUES.md: 18 human/current-LIVE observations (including two Fail), 18 provider/account observations, and eight separate historical product human retests. Production merge/domain/SSL/www/header/email validation still requires the next human gate. Physical devices, qualified legal/service review, mailbox delivery and future provider tests are not established by this Preview.

## Next human decision

Preview passed. Do you approve merging PR #23 and moving odesosgames.com production hosting to this Cloudflare Worker?

Wait for explicit YES. Preserve MX/email-routing TXT records and contact@odesosgames.com during any subsequently approved migration. This report does not authorize it.
