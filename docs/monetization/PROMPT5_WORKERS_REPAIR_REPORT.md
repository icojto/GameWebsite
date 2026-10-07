# Cloudflare Workers static hosting repair — PR #23

Date: 7 October 2026. Branch: codex/prompt5-gate2-release-0.2.0. Base main e60a6833261f56a05563e37918e03433a65100ae. Pre-patch clean head 148813ee165ecd33c8bd30c09414913df25cbc51; PR #23 verified open and Draft. No unrelated work or primary-checkout product files changed.

## Root cause and final target

The human-reported Cloudflare build completed npm run build but the auto-generated Worker assets configuration lacked assets.directory, so npx wrangler deploy failed. It built main Website 0.1.0, not PR #23 Website 0.2.0. Original plan was Pages; final target is Workers static assets + Git integration. No actual public Worker deployment is claimed here.

## Repository repair

Committed wrangler.jsonc: official schema; name gamewebsite; compatibility_date 2026-10-07; assets.directory ./dist; not_found_handling 404-page; html_handling auto-trailing-slash. No main Worker script, backend, bindings, secrets, custom-domain routes or observability enablement. Existing _headers policy unchanged, without speculative Google origins or weaker CSP.

Exact Wrangler 4.148.0 development dependency and lockfile improve repeatability over an unpinned npx download. npm ci succeeds; all existing runtime packages and root production dependencies are unchanged. Existing npm run preview and qa:preview remain Vite commands. Added cf:check (deploy --dry-run --outdir .wrangler/dry-run), cf:dev (dev --local bound to loopback). Temporary Wrangler/secret files ignored. Local CLI metrics disabled with WRANGLER_SEND_METRICS=false, distinct from absent visitor analytics.

Renamed verify:pages to verify:static-release and generator to static-routes, with existing metadata/catalog/public+hidden embeds/robots/sitemap/social image/accessibility coverage retained. Added artifact checks for static configuration, _headers copy, actual 404 body/status and portal mount. Provider-neutral static-release CI runs on PRs/main, adds dry-run, uploads dist and does not deploy. README, release checklist, versioning, privacy hosting statement and current human handoff use Workers; historical Pages evidence remains preserved.

Browser QA discovered the existing generated 404 had no #app and emitted “Portal root is missing”; its privacy button was inactive. A minimal mount wrapper fixes initialization without changing the static architecture or 404 HTTP status. Browser retest on an actual unknown URL opens the privacy dialog, safe confirmation and Cancel. Static content remains branded; hydrated portal uses its existing “That route is outside the arena” view. Original failure console observation retained in browser-console.json; subsequent proof recorded separately. Unattributed IAB MutationObserver observation is not assigned to product or concealed.

## Validation

230 deterministic tests Pass, zero Fail. All requested checks passed: check, test:qa-contract, test:monetization, test:portal, test:ads, test:orbit, test:orbit-ads, test:reactor, test:reactor-ads, build, verify:ads-production, verify:static-release, cf:check and git diff --check. verify:pages was cleanly replaced rather than retaining an obsolete provider command. Existing Phaser chunk advisories remain non-blocking.

Wrangler dry-run reads 61 assets, validates configuration, reports no bindings and exits without upload/authentication. Local Worker owns http://127.0.0.1:5203; 22 HTTP checks pass: seven public routes, unknown branded 404, six canonical slash redirects (307), public game embeds, robots/sitemap, three hidden portal routes remain404 and _headers is not public. Actual local responses carry all six expected security headers. This HTTP check does not prove real Cloudflare Preview delivery or HTTPS/HSTS enforcement.

Actual browser accesses the local Worker; all public/legal/404 pages show Website 0.2.0 and privacy entry, both games mount a real canvas and start under CSP. Privacy inactive-CMP notice, Clear Local Data confirmation/Cancel work. No DEV panel or real provider. Prior scoped-reset unit/UI evidence remains preserved; destructive reset was not repeated unnecessarily in this hosting repair. Production guard verifies all generated HTML production identity/version and no DEV/ad SDK boundaries. Full packet capture/storage enumeration and physical checks remain separate human gates.

## Workbook and remaining gates

Old = new: 38 Pass / 2 Fail / 34 Blocked / 1 N/A / 0 Not run. Exactly zero IDs changed. Existing repository preparation is already Pass; this repair strengthens that evidence but cannot close actual Cloudflare deployment rows. SEC-002 and SEC-003 remain current live Fail, actual Preview/custom-domain headers remain unverified. Both workbook hashes preserved; updated SHA256 204f8880b0868f4284f21c9a18c23c206af5953eeb126292b99736951b7d04bb. The existing finalized workbook is now named OdesosGames_Monetization_Compliance_QA_v1.1.xlsx; its hash exactly matches the prior delivered record, so the name change is preserved without rewriting or creating another copy. All original Gate1/Gate2 history retained. Previous output instructions also backed up in workers-repair/history before updating current handoff.

Current gate: Hristo opens Worker gamewebsite, confirms repo, main production branch, Preview builds ON, npm run build, no application variables/secrets, Cloudflare-managed token, tracking OFF/ordinary Preview Access OFF. Current non-production Preview command is npx wrangler preview (older versions upload creates a Version URL, not a Preview). Get the exact branch URL from Cloudflare build details for the pushed PR head and confirm Website 0.2.0; return it for next-stage real Cloudflare QA. No merge/domain switch/deployment/account submission/CMP/ads performed in this task.

PR: https://github.com/icojto/GameWebsite/pull/23 — remains Draft. Exact dashboard and source-backed instructions: CLOUDFLARE_DEPLOYMENT_GATE.md and docs/release/cloudflare-workers-static.md.


## Clean implementation checkpoint

Committed and browser-tested implementation: 7a7fec095b0ef22203b474d55f06fbcfcbc9f0ca, clean production build 0802bb07-d348-4ecd-b58e-5f86d3c303d5, Website 0.2.0. Fresh unknown-route browser test opens Clear Local Data confirmation, Cancel/Close work and captured console errors/warnings are empty. Clean-build static verification, Wrangler dry-run and all 22 local Worker HTTP checks pass. Any following checkpoint commit changes only this report/journal; product code remains exactly this tested implementation. Real Cloudflare Preview remains the next human gate.
