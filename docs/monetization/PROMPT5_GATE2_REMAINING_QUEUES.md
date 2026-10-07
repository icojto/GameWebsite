> Privacy correction (2026-10-07): address and telephone disclosure remain Blocked pending qualified confirmation and approved lawful safe values. LEG-001, LEG-003-C and G2-LEG-001 changed from Pass to Blocked. Current totals: 75 cases, 35 Pass, 2 Fail, 37 Blocked, 1 N/A. Historical figures below describe the earlier checkpoint. Current public contact is email only.

# Gate 2 exact remaining queues

36 open observations: 2 current live Fail and 34 Blocked. No Not run. Applicable=74; verification=(Pass+Fail)/Applicable, not Blocked. No reclassification to N/A to inflate results.

## HUMAN — 18 observations

| ID | Status | Requirement / remaining dependency | Next step |
|---|---|---|---|
| LEG-002 | Blocked | Individual/no company baseline approved. Conditional VAT, registration or licensing applicability has not been confirmed; no identifiers invented. | Hristo confirms any applicable VAT/licensing/registration obligations; do not invent identifiers. |
| LEG-005 | Blocked | Candidate factual Terms now exist and preserve mandatory rights; current free-service consumer and English-language applicability still needs qualified review. No unverified governing-law clause. | Qualified current Bulgarian review of free-service consumer/language applicability; candidate Terms preserve mandatory rights and omit an unverified governing-law clause. |
| PRI-002 | Blocked | Actual Orbit source creates an initial profile and persistent saves have no TTL. Purpose-by-purpose lawful necessity/explicit-request and proportionate retention assessment is not closed by providing reset. | Qualified purpose-by-purpose terminal storage assessment, including Orbit initial save; clear/reset alone is not consent exemption. |
| PRI-006 | Blocked | Cloudflare routing and correspondence retention/operation confirmed. Actual service contracts, processing roles, provider security/log retention and transfer safeguards still need human review. | Hristo reviews actual Cloudflare/mail service roles, contracts, security/log retention and transfer safeguards. Correspondence retention and mailbox operation are now confirmed. |
| PRI-007 | Blocked | Proportionate rights/incident checklist documented; formal records, DPO/DPIA and applicable notification assessment needs owner/qualified confirmation. | Hristo confirms proportionate governance/DPO/DPIA/records applicability; follow the documented rights/incident checklist. |
| PRI-008 | Blocked | General audience, not child-directed, no accounts/age collection. Applicable triggered child-processing assessment remains qualified review; no invented age gate. | Qualified review only where current child-processing rules are triggered; no invented age collection or age gate. |
| SEC-002 | Fail | Reproduced on current live PR22 build: HSTS absent. Candidate _headers contains max-age=31536000 and local responses carry it; live HTTPS enforcement cannot pass until human Cloudflare deployment and header proof. | Human deploys Cloudflare Workers static hosting and verifies actual HTTPS HSTS response; do not close from source/local HTTP. |
| SEC-003 | Fail | Reproduced on current live PR22 build: nosniff and Permissions-Policy absent. Candidate local headers are present and both games boot; current public gap remains until migration. | Human deploys Cloudflare Workers static hosting and verifies actual response headers. |
| SEC-005 | Blocked | Self-only candidate CSP compatibility verified on both games; actual Worker Preview/custom-domain CSP response and future approved provider expansion remain gated. | Measure candidate self-only CSP locally; real Pages/custom-domain header and future approved provider-origin verification remain gated. |
| SEC-006 | Blocked | Current release explicitly uses same-origin portal/game embedding; candidate frame-ancestors self and SAMEORIGIN tested locally. Actual deployment response remains unverified. | Current release uses same-origin embedding only. Verify actual Worker Preview/custom-domain frame-ancestors/SAMEORIGIN; external distribution needs separate review. |
| NET-003 | Blocked | Cloudflare Workers static hosting selected and repository migration prepared. Actual Pages project/service review, public cutover and deployment evidence are human-owned and pending. | Selected Cloudflare Workers static hosting migration is prepared; human cutover, applicable service review and actual deployment proof remain. |
| HQA-001 | Blocked | Historical product workbook remains 316 Pass / 8 Fail / 8 N/A. No returned physical/subjective closure for ORB012 REA022 REA024 OAD005 OAD006 RAD011 MOB027 MOB033. | Supply product retest evidence for ORB012, REA022, REA024, OAD005, OAD006, RAD011, MOB027, MOB033. |
| HQA-002 | Blocked | Approved facts/mailbox attestation received; actual Gate 2 grouped human release QA Sessions A-D not returned. Session E waits deployment. | Complete Gate 2 Sessions A-D; actual live deployment is separately G2-HOST-001 / Session E. |
| SIG-001 | Blocked | Candidate ready for human QA; real monetization activation blocked by human/legal/product/provider/deployment gates. Identity details now approved; no account submission or real ads. | Stop at Gate 2 human handoff. No account creation/submission, agreements, deployment or real ads performed. |
| PRI-003-R | Blocked | CUA read-only DOM does not enumerate runtime storage/cookies. Registry/unit tests and UI-visible saved-state checks completed; full DevTools/conditional security-cookie inspection remains human-only. | Human inspects DevTools Application storage/cookies and Network response Set-Cookie on fresh visits and triggered security flows. |
| G2-HOST-001 | Blocked | Human account/project connection, main merge, Pages build/deploy, DNS/SSL/www/header verification not performed. Current public origin remains GitHub Pages behind Cloudflare. | Complete the named human session and return evidence. |
| G2-MAIL-001 | Blocked | Operational mailbox already attested; human confirms mailto/external receipt/reply/correct sender on release. No private forwarding inbox in artifacts. | Complete the named human session and return evidence. |
| G2-MOB-001 | Blocked | Required physical checks are not established by eight emulated desktop viewport sizes. | Complete the named human session and return evidence. |

## PROVIDER / ACCOUNT / FUTURE INTEGRATION — 18 observations

| ID | Status | Requirement / remaining dependency | Next step |
|---|---|---|---|
| CMP-001 | Blocked | No account, certified CMP message or Google advertising SDK active. Actual provider-certified regional TCF 2.3 configuration awaits later account/integration approval. | Human configures preferred Google CMP after account and release-ready privacy URL. |
| CMP-002 | Blocked | No active CMP or consent record. Actual regional Do not consent/manage/language/vendor configuration awaits approved provider integration. | Human reviews and publishes choices/language/vendors. |
| CMP-003 | Blocked | Current same-origin iframe bridge verified; actual top-level CMP signal and game-document H5 propagation require later approved integration. | Design actual consent propagation and game-document adapter at later approved integration. |
| CMP-005 | Blocked | No ads active. Actual refusal/limited-ad IVT storage settings and lawful consent/basis decisions await owner/provider review. | Human reviews limited-ad IVT storage settings and justified consent/basis path. |
| ADS-001 | Blocked | No existing/prior account or suspension per baseline. Actual eligible individual account, age eligibility and human agreements are not completed. | Human confirms 18+ and accepts terms directly; no secrets here. |
| ADS-002 | Blocked | No account/site submission or Google review. Domain ownership/site verification awaits explicit next human/provider gate after release QA. | Prefer available meta verification before ad script; actual account instructions control. |
| ADS-003 | Blocked | Original games, legal/trust content and reset prepared; current live hosting/headers, qualified review and actual Google site assessment remain prerequisites. | Close verified site gaps before review; never click own ads. |
| H5-001 | Blocked | H5 NOT SUBMITTED. No approved access; account/site review is not H5 approval. | Human applies after AdSense account exists; individual form ambiguity goes to Google. |
| H5-002 | Blocked | No H5 SDK loaded. Disabled adapter remains unregistered; actual approved game-canvas-document integration is deferred. | Prepare disabled boundary; implement game-document adapter only after approval. |
| H5-004 | Blocked | No approved H5 SDK/test configuration. Supported test-mode verification awaits access; no live impressions or clicks attempted. | Later controlled data-adbreak-test="on" integration; human/provider-safe live checks. |
| PLC-002 | Blocked | Null serves no interstitials. Actual provider placement classification/cooldowns at natural transitions await approved integration; prior mock semantics remain tested. | Classify each real placement at 5J; pause remains conditional until defensible. |
| PLC-003 | Blocked | No actual provider timing to validate. No current real interruption, ad chaining or navigation ad; real placement checks remain gated. | Preserve rate policy and validate real provider timing later. |
| RWD-001 | Blocked | Orbit revive and Reactor +1 Cool/+1 Upgrade contracts exist; final actual provider-facing opt-in/disclosure/decline path requires approved integration. | Review final provider-facing button copy before activation. |
| TXT-002 | Blocked | Real publisher ID/account entry absent; future exact root seller entry and crawlability cannot yet be verified. | Generate from account data after approval; verify 200/plain text and recrawl. |
| TXT-003 | Blocked | No account seller identity/public visibility setting. Explicit human seller choice deferred until actual account values and implications exist. | Show actual payments name, seller ID/domain and current revenue consideration; then ask. |
| MOB-002 | Blocked | Real SDK absent and physical Android/iOS actual-ad sizing/input/audio checks unavailable; requires provider access and later physical QA. | Human performs actual provider-safe physical QA after approvals. |
| FAIL-002 | Blocked | Actual approved CMP/SDK offline/adblock/revocation/no-fill paths cannot be tested before that integration; no repeated unavailable attempts. | Later targeted provider test-mode checks without repeated unavailable attempts. |
| HUM-002 | Blocked | No account/CMP dashboard; actual limited-ad and seller choices are deferred to a later explicit human/provider phase. | Complete ordered checklist after legal/product prerequisites. |

Provider rows are deliberately deferred; this release does not authorize account creation/submission/agreements or provider activation. Actual Cloudflare migration is a human deployment gate. Qualified legal determinations are human/qualified-review gates, not assumed automated legal certainty.

## Separate historical product human queue

ORB012, REA022, REA024, OAD005, OAD006, RAD011, MOB027, MOB033. Previous product workbook remains 316 Pass / 8 Fail / 8 N/A; no new human closure was supplied. These eight are not added to this workbook's denominator.


## Workers static hosting repair — 7 October 2026

The Pages plan and local Pages-compatible evidence above are historical. The final selected target is Cloudflare Workers static assets with Git integration. See docs/release/cloudflare-workers-static.md and PROMPT5_WORKERS_REPAIR_REPORT.md for the current configuration, local validation and Preview handoff. Original counts remain 38 Pass / 2 Fail / 34 Blocked / 1 N/A; no live deployment row is closed by repository configuration. Current human gate: obtain the PR #23 branch Worker Preview URL and verify Website 0.2.0 before any merge/domain switch.

## Current privacy-corrected queues

Human / legal / production gates (21): LEG-001, LEG-002, LEG-005, LEG-003-C, G2-LEG-001, PRI-002, PRI-006, PRI-007, PRI-008, PRI-003-R, SEC-002, SEC-003, SEC-005, SEC-006, NET-003, G2-HOST-001, G2-MOB-001, HQA-001, HQA-002, G2-MAIL-001, SIG-001.

Provider prerequisites (18): CMP-001, CMP-002, CMP-003, CMP-005, ADS-001, ADS-002, ADS-003, H5-001, H5-002, H5-004, PLC-002, PLC-003, RWD-001, TXT-002, TXT-003, MOB-002, FAIL-002, HUM-002.

Existing production failures retained: SEC-002, SEC-003.
