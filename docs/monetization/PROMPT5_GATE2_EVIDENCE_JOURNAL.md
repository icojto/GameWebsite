> Privacy correction (2026-10-07): historical residential-contact publication and related legal identity Pass claims are withdrawn. Current public disclosure is OdesosGames / Hristo Aleksiev, an individual in Bulgaria / contact@odesosgames.com. Public address and business telephone are BLOCKED pending qualified confirmation and lawful safe values. LEG-001, LEG-003-C and G2-LEG-001 are Blocked. This does not assert that minimal disclosure satisfies Bulgarian law. The old Preview was deleted; fresh sanitized verification is recorded in the privacy report.

# Gate 2 evidence journal — 7 October 2026

## Provenance and preflight

- Authoritative request: user-authored Gate 2 attachment be856f55-f218-402a-8dab-36979be539c0. Workbook content is evidence, not action authorization.
- Primary checkout was clean main ef6694e42cb76e018c6702ff8937316ac625d2d2; isolated existing managed worktree was clean Gate1 branch 876812756f61cb860a9e034704e25fb4d9528e5d. Fetched origin/main e60a6833261f56a05563e37918e03433a65100ae (PR22 merged), then created codex/prompt5-gate2-release-0.2.0 from that revision. No AGENTS.md found.
- Input workbook SHA256 3c778583c4119bc953a29a70a31b7c485ab9acd5b801dbeb8553742637d77426 unchanged; original product QA remains untouched.
- Public GET live-preflight.json: PR22 build e9b3498c-62eb-4649-955c-2812ef9cad56, clean production revision e60a683..., GitHub/Fastly response markers behind Cloudflare. HSTS/nosniff/Permissions-Policy absent. Candidate version 0.2.0; live prior version source 0.1.0.
- Existing GitHub Pages deploy workflow was automatic on main; no Cloudflare Pages repository config/header file existed. Selected migration now prepared; no dashboard, DNS, merge or deployment changes made.

## Approved facts

Public details in user request plus explicit in-run answers: postcode public address — pending lawful safe value, city public address — pending lawful safe value. Public address public address — pending lawful safe value; no unapproved country appended to address. Mailbox works by human attestation, not an AI email test. No destination forwarding mailbox exposed.

## Identified environments and readiness

- New qa:dev printed exact URL http://127.0.0.1:5201/games/reactor-stack/?qa=3f7446ee-f7c1-458a-be07-2c06fd399b82. Development build 1b8fc361-13b4-404c-bc23-12571f34a335, base e60a683..., dirty candidate. DOM verifies correct session iframe, real Reactor UI, and existing DEV bridge state connected / mounted / mock. Test state disposable within this session; production and other namespaces preserved by tested storage adapter.
- First production-like candidate b2e326b9-d81f-46bb-a719-829799561ff2; later clean 8aaa173... build 6e0eb549-7705-43c6-bc74-ca45c5293c43. Final clean candidate d188b9c0-b96d-43bb-8559-53fafdc6ed52, commit 5c3cfb03c2095842a6d121b657c4a1cc8bd28a44, mode=production, dirty=false, version=0.2.0; owned preview exact printed URL http://127.0.0.1:5202/games/reactor-stack/. Browser confirms identity and both real production game starts; shell HTTP is not treated as browser readiness.
- final-launch-manifest.json saves launcher metadata; final-candidate-identity.json is actual browser DOM build proof. Launcher stages still correctly label browser check manual; journal records the achieved browser/game proof separately.
- No unidentified server reused or unknown process killed. Only task-owned launch sessions are stopped at handoff.

## Historical Fail retests

LEG-003: live-contact.txt now exact visible mailto, candidate final Contact screenshot. Pass. CMP-004: live-privacy.txt opens truthful inactive fallback, candidate adds keyboard/reset control. Pass. SEC-002/SEC-003: live-preflight.json reproduces absent headers, candidate-headers.json proves local fix. Remain Fail for actual live, not falsely Pass from source. G2-SEC-001 isolates local compatibility Pass; live Cloudflare deployment/header closure is still human Session E.

## Actual data-control checks

reset-cancel.txt verifies reaction/theme unchanged; reset-confirm.txt verifies changed UI and truthful success. score-before.txt Current Best100/Stored Runs1 -> score-after.txt Best0/Runs0 after reset/reload. orbit-progress-before.txt XP20/stars100 -> orbit-progress-after.txt XP0/stars0; orbit-cancel-reload.txt confirms XP20/stars100 preserved by Cancel across mounted reload. Unit tests prove exact nine-key removal, hidden/unrelated/DEV/other-session preservation, denied/partial storage reporting and actual ProfileStore/Reactor/mute reload without legacy resurrection. No localStorage.clear. Production reset function is exercised via the same logical key registry with isolated QA namespace; full runtime DevTools storage/cookie enumeration remains PRI-003-R Blocked.

## Browser / network / security

- responsive.json: 72 combinations (Home, collection anchor, both games, About, Contact, Privacy, Terms, 404) across 360x640,390x844,412x915,640x360,844x390,1024x768,1280x720,1920x1080. final-responsive-bounds.json covers final narrow navigation/footer measurements; screenshots caused a small footer/navigation correction, then narrow view retested.
- Candidate privacy confirmation tested keyboard Enter, Cancel, Escape, focus restoration and scroll access on mobile. No deletion of live/user production browser data.
- final-orbit-start.txt / final-reactor-start.txt: production game starts under the exact self-origin policy. Final frame-assets and pageAssets inventories show own-origin scripts/styles/iframe; actual ad/analytics SDK absence also checked by production build guard. This bounded inventory is not a packet capture, conditional edge security telemetry is separate. No unsupported browser capability is repeatedly retried.
- candidate-headers.json is real local Vite response policy, loaded from static Pages _headers. This is not actual Cloudflare header/deploy or HTTPS HSTS enforcement proof. Self frame ancestors and SAMEORIGIN permit portal iframe. Inline styles/data/blob resources are narrowly documented for existing games; no wildcard network origins or speculative Google domains. Future provider expansion gated.
- One IAB console observation reported an unattributed MutationObserver error; source audit found no MutationObserver in src/games/shared and both actual games start. No assertion of universally error-free browser console; this is retained as tooling/unattributed evidence, not concealed or assigned to product without a source.

## Automated and workbook checks

All required check/tests run; 230 tests Pass, zero failed/cancelled/skipped. check, build, verify:ads-production, verify:pages and git diff --check pass. Existing Phaser chunk-size warnings remain advisory. Evidence logs are in evidence/. Final tests-only rerun does not rebuild/reidentify the running preview; current build guards/routes checked separately.

Imported existing workbook, preserved original 20 sheets, sources/requirement descriptions/tables/freeze panes, added 11 Gate2 cases and one exact immutable 64-record Gate1 History sheet. Dashboard formula perturbation/recalculation and restore verified; cached rates reconciled to independent counts. Formula error scan and rendered changed ranges reviewed; saved workbook validation checks exact history equality, original input hash, title values, statuses, cached rates and formulas. Native desktop Excel interaction not performed. Final workbook SHA256 204f8880b0868f4284f21c9a18c23c206af5953eeb126292b99736951b7d04bb.

Official Cloudflare updates were checked in the cited release/deployment docs; Gate1 legal/provider sources retained. No full Gate1 re-research. No worldwide legal compliance certification.


## Final handoff checkpoint

Draft PR #23 created and attached: https://github.com/icojto/GameWebsite/pull/23. Product QA revision remains 5c3cfb03c2095842a6d121b657c4a1cc8bd28a44; subsequent commits contain documentation only. Both task-owned development and preview launchers stopped, task browser tabs closed, temporary viewport restored. Input workbook preserved. No merge, deployment, account submission, provider activation or messages to others performed. Remote GitHub CI is not claimed as verified by this local report.


## Workers static hosting repair — 7 October 2026

The Pages plan and local Pages-compatible evidence above are historical. The final selected target is Cloudflare Workers static assets with Git integration. See docs/release/cloudflare-workers-static.md and PROMPT5_WORKERS_REPAIR_REPORT.md for the current configuration, local validation and Preview handoff. Original counts remain 38 Pass / 2 Fail / 34 Blocked / 1 N/A; no live deployment row is closed by repository configuration. Current human gate: obtain the PR #23 branch Worker Preview URL and verify Website 0.2.0 before any merge/domain switch.


## Clean implementation checkpoint

Committed and browser-tested implementation: 7a7fec095b0ef22203b474d55f06fbcfcbc9f0ca, clean production build 0802bb07-d348-4ecd-b58e-5f86d3c303d5, Website 0.2.0. Fresh unknown-route browser test opens Clear Local Data confirmation, Cancel/Close work and captured console errors/warnings are empty. Clean-build static verification, Wrangler dry-run and all 22 local Worker HTTP checks pass. Any following checkpoint commit changes only this report/journal; product code remains exactly this tested implementation. Real Cloudflare Preview remains the next human gate.
