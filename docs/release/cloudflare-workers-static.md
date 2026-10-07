# Cloudflare Workers static hosting — human Preview gate

Website 0.2.0 / existing Draft PR #23 / 7 October 2026.

ORIGINAL PLAN: Cloudflare Pages. FINAL HOSTING TARGET: Cloudflare Workers static assets with Git integration. The dashboard selected Workers and its auto-generated assets configuration omitted directory, so the prior deploy failed after a successful build. It also built main (0.1.0); that does not indicate a 0.2.0 regression. Historical Pages evidence is retained in the repair history and original reports.

## Exact dashboard settings

Open Workers & Pages > gamewebsite > Settings > Build (or Import repository to correct a missing connection). Confirm these values before the next branch build:

| Setting | Value |
|---|---|
| Repository | icojto/GameWebsite |
| Worker name | gamewebsite |
| Production branch | main |
| Preview builds | ON; include codex/prompt5-gate2-release-0.2.0 |
| Build command | npm run build |
| Production deploy command | npx wrangler deploy |
| Preview command | npx wrangler preview |
| Root directory | repository root / blank, or / if required |
| Node | repository .node-version selects 24; confirmed previous build used Node 24 |
| Application build/runtime variables | NONE |
| Application secrets/bindings | NONE |
| API token | Cloudflare-managed Git integration token; no manual token required |
| Cloudflare Access | OFF for this public site and ordinary review Preview |
| Tracking | Web Analytics, Zaraz, visitor analytics SDKs OFF |

Current official Workers Builds documentation defaults to npx wrangler preview for non-production branches. It produces a Preview URL without promoting production. If the existing dashboard still displays the older Non-production branch deploy command = npx wrangler versions upload, it creates a version/version URL without promoting production; use the current Preview command where supported, and identify the resulting URL accurately. Do not set npx wrangler deploy as the non-production command. Neither Preview nor upload is run by this repository repair task.

## Committed static configuration

wrangler.jsonc uses the official Wrangler schema, compatibility_date 2026-10-07 and:

```json
{
  "name": "gamewebsite",
  "assets": {
    "directory": "./dist",
    "not_found_handling": "404-page",
    "html_handling": "auto-trailing-slash"
  },
  "previews": {}
}
```

There is no Worker script, API, backend, database, binding, secret, observability enablement or custom-domain route. The pinned development dependency supplies the same Wrangler version to local validation and Workers Builds. Wrangler reads dist/_headers and does not serve that configuration as a public asset. Security headers retain same-origin game embedding and the existing measured CSP; future Google origins remain gated.

## Hristo's next steps — Preview only

1. Open Cloudflare Worker gamewebsite and confirm the repository connection above.
2. Keep production branch main. Enable Preview builds for the existing PR branch.
3. Confirm build command npm run build, root directory, Node 24, no application variables/secrets and the Preview command above.
4. The branch push is already complete. Wait for the non-production branch build. If it did not trigger, use the dashboard's branch Preview build control; do not retry a main production deployment to obtain this Preview.
5. In the Worker Builds/Preview build details, find the URL associated with codex/prompt5-gate2-release-0.2.0 and its latest commit. The connected GitHub commit/PR build check may also link to these build details. Copy the actual generated Preview URL; do not construct or guess it from a branch name.
6. Open that URL and confirm the footer says Website 0.2.0. Check the build identity belongs to the latest PR revision, not main 0.1.0. Return the Preview URL to Codex for the next real Cloudflare QA stage.

Production workers.dev/custom-domain traffic is separate from the branch Preview. Do not merge PR #23, modify production DNS, connect odesosgames.com or activate the custom domain in this step. Later human-approved production migration must preserve MX/email-routing TXT records and prove SSL, actual origin/build, route/404 responses and response headers. No pages.dev URL or Pages project settings apply to this final target.

## Evidence and limits

Local Wrangler dry-run/config acceptance and local Worker routing/headers are repository/emulator evidence, not public deployment proof. Existing SEC-002 and SEC-003 live failures stay open. Cloudflare Preview and later custom-domain SSL/header evidence remain Blocked until observed. QA counts stay 38 Pass / 2 Fail / 34 Blocked / 1 N/A unless explicitly reconciled in the repair report. No AdSense/H5 submission, CMP, real ads or analytics.

## Official sources checked 7 October 2026

- [Static configuration and assets.directory](https://developers.cloudflare.com/workers/static-assets/binding/)
- [Custom 404 and static-site generation](https://developers.cloudflare.com/workers/static-assets/routing/static-site-generation/)
- [HTML trailing-slash handling](https://developers.cloudflare.com/workers/static-assets/routing/advanced/html-handling/)
- [Static _headers behavior](https://developers.cloudflare.com/workers/static-assets/headers/)
- [Workers Builds commands and managed token](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/)
- [Wrangler local/dry-run commands](https://developers.cloudflare.com/workers/wrangler/commands/workers/)

## Preview configuration repair — 7 October 2026

The branch build at 57af984 succeeded, but Wrangler 4.148.0 rejected the Preview deploy because the required previews block was absent. An explicit empty previews block enables this static-only Preview; assets and compatibility settings stay at the top level. No Preview bindings or runtime variables are needed. The static release guard now rejects this omission before a branch reaches Cloudflare. See [Worker Preview configuration](https://developers.cloudflare.com/workers/previews/configuration/).

## Real branch Preview verified

The 5653525 build deployed successfully to https://codex-prompt5-gate2-release-0-2-0-gamewebsite.icojto.workers.dev (immutable deployment 6829e410). Website 0.2.0, legal/contact routes, both game starts, privacy/reset Cancel and browser-navigation branded HTTP 404 with six configured headers passed. Generic non-navigation missing requests return plain HTTP 404. See docs/monetization/PROMPT5_CLOUDFLARE_PREVIEW_REPORT.md for exact evidence and scope. Await Hristo before merge/domain migration; LIVE SEC-002/003 failures and mixed human/provider requirements remain open.
