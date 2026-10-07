# Exact remaining queues

As of 7 October 2026. Blocked is not verified. Candidate passes do not close undeployed live findings.

## Fail: 4

- **LEG-003** (Legal & Identity): Live Contact omits contact@odesosgames.com. Next: Replace outdated contact text with approved mailto link. Owner: AI after human prerequisite.
- **CMP-004** (CMP & Consent): Entry absent on live site. Next: Add safe entry/fallback now; future API hook must not assert consent. Owner: AI after human prerequisite.
- **SEC-002** (Security & Headers): HSTS absent in audited GET. Next: Human confirms SSL/redirect/hostname coverage; add conservative max-age only after validation. Owner: Hristo / qualified adviser / provider.
- **SEC-003** (Security & Headers): Both headers absent in audited GET. Next: Human Cloudflare response-header rules; avoid restricting needed fullscreen/autoplay. Owner: Hristo / qualified adviser / provider.

## Blocked: 35

- **LEG-001** (Legal & Identity): Individual Bulgaria; exact public identity/address/phone absent. Next: Hristo supplies and approves minimum public values or obtains qualified advice on lawful disclosure. Owner: Hristo / qualified adviser / provider.
- **LEG-002** (Legal & Identity): No registered company claimed; VAT/licensing facts not supplied. Next: Confirm applicability; never invent registration or VAT ID. Owner: Hristo / qualified adviser / provider.
- **LEG-004** (Legal & Identity): No delivery test; DNS lookup found no MX answer, only SOA. Next: Human verifies mail routing and performs external receipt/reply test. Owner: Hristo / qualified adviser / provider.
- **LEG-005** (Legal & Identity): September 2026 consumer amendment identified; full applicability not legally settled. Next: Qualified Bulgarian review before releasing Terms; no blanket waiver/arbitration. Owner: Hristo / qualified adviser / provider.
- **PRI-001** (Privacy & Storage): Privacy route absent; identity/provider operational facts incomplete. Next: Prepare internal draft; release only after identity and actual retention/basis decisions. Owner: Hristo / qualified adviser / provider.
- **PRI-002** (Privacy & Storage): Orbit profile initial save and indefinite local progression observed in source. Next: Resolve explicit-request/necessity and retention assessment; gate non-exempt storage before use if required. Owner: Hristo / qualified adviser / provider.
- **PRI-005** (Privacy & Storage): No public privacy notice. Next: Add only with approved notice; local saves cannot be remotely recovered by operator. Owner: Hristo / qualified adviser / provider.
- **PRI-006** (Privacy & Storage): CDN and GitHub confirmed; mail provider and owner retention unknown. Next: Human confirms agreements/settings, legitimate-interest assessment where relied on, and email retention. Owner: Hristo / qualified adviser / provider.
- **PRI-007** (Privacy & Storage): No evidence of high-risk visitor processing or large-scale monitoring. Next: Document applicability; appropriate incident/rights procedure still required. Owner: Hristo / qualified adviser / provider.
- **PRI-008** (Privacy & Storage): General audience approved; no account/age collection; BG Article 25c read in government-hosted consolidation. Next: Do not add age gate without requirement; verify full current BG act and actual applicability before child-specific processing. Owner: Hristo / qualified adviser / provider.
- **CMP-001** (CMP & Consent): No account, message or advertising tag active. Next: Human configures preferred Google CMP after account and release-ready privacy URL. Owner: Hristo / qualified adviser / provider.
- **CMP-002** (CMP & Consent): No active CMP. Next: Human reviews and publishes choices/language/vendors. Owner: Hristo / qualified adviser / provider.
- **CMP-003** (CMP & Consent): Portal hosts same-origin game iframe and current host ad bridge. Next: Design actual consent propagation and game-document adapter at later approved integration. Owner: Hristo / qualified adviser / provider.
- **CMP-005** (CMP & Consent): No advertising enabled. Next: Human reviews limited-ad IVT storage settings and justified consent/basis path. Owner: Hristo / qualified adviser / provider.
- **ADS-001** (Google AdSense): Approved baseline: no existing/prior account, no suspension. Age eligibility unconfirmed. Next: Human confirms 18+ and accepts terms directly; no secrets here. Owner: Hristo / qualified adviser / provider.
- **ADS-002** (Google AdSense): No account/site submission. Next: Prefer available meta verification before ad script; actual account instructions control. Owner: Hristo / qualified adviser / provider.
- **ADS-003** (Google AdSense): Original games present; public legal/privacy/contact gaps remain. Next: Close verified site gaps before review; never click own ads. Owner: Hristo / qualified adviser / provider.
- **H5-001** (Google H5): NOT SUBMITTED per approved baseline. Next: Human applies after AdSense account exists; individual form ambiguity goes to Google. Owner: Hristo / qualified adviser / provider.
- **H5-002** (Google H5): No SDK; host bridge currently owns abstract ad service. Next: Prepare disabled boundary; implement game-document adapter only after approval. Owner: Hristo / qualified adviser / provider.
- **H5-004** (Google H5): No real provider SDK or test configuration. Next: Later controlled data-adbreak-test="on" integration; human/provider-safe live checks. Owner: Hristo / qualified adviser / provider.
- **PLC-002** (Ad Placement Policy): Orbit PLAY/RESTART and Reactor start/restart/pause semantics exist in mock lifecycle. Next: Classify each real placement at 5J; pause remains conditional until defensible. Owner: Hristo / qualified adviser / provider.
- **PLC-003** (Ad Placement Policy): Null serves none; real placement validation unavailable. Next: Preserve rate policy and validate real provider timing later. Owner: Hristo / qualified adviser / provider.
- **RWD-001** (Rewarded Ads): Orbit revive and Reactor Cool/Upgrade retain mock/Null lifecycle. Next: Review final provider-facing button copy before activation. Owner: Hristo / qualified adviser / provider.
- **TXT-002** (ads.txt & sellers.json): Provider ID absent. Next: Generate from account data after approval; verify 200/plain text and recrawl. Owner: Hristo / qualified adviser / provider.
- **TXT-003** (ads.txt & sellers.json): No account; selection intentionally deferred. Next: Show actual payments name, seller ID/domain and current revenue consideration; then ask. Owner: Hristo / qualified adviser / provider.
- **SEC-005** (Security & Headers): No CSP header. Provider origins not yet observed. Next: Begin dashboard report-only self baseline; review reports and precise provider origins before enforcing. Owner: Hristo / qualified adviser / provider.
- **SEC-006** (Security & Headers): Same-origin portal embeds games; future external distribution undecided. Next: Human decides embedding scope; use response header, not meta frame-ancestors. Owner: Hristo / qualified adviser / provider.
- **NET-003** (Production Network): Pages commercial-use restriction found; classification not resolved. Next: Human gets written GitHub clarification or selects appropriate hosting before monetization. Owner: Hristo / qualified adviser / provider.
- **MOB-002** (Mobile & Responsive Ads): No real SDK; physical devices unavailable to AI. Next: Human performs actual provider-safe physical QA after approvals. Owner: Hristo / qualified adviser / provider.
- **FAIL-002** (Failure No-Fill Adblock): No approved SDK integration. Next: Later targeted provider test-mode checks without repeated unavailable attempts. Owner: Hristo / qualified adviser / provider.
- **HUM-002** (Human Account Setup): Account absent; no dashboard settings changed. Next: Complete ordered checklist after legal/product prerequisites. Owner: Hristo / qualified adviser / provider.
- **HQA-001** (Human QA): Historical workbook remains 316 Pass / 8 Fail / 8 N/A. PR21 merged/live ef6694e does not close evidence. Next: Supply product retest evidence for ORB012, REA022, REA024, OAD005, OAD006, RAD011, MOB027, MOB033. Owner: Hristo / qualified adviser / provider.
- **HQA-002** (Human QA): No human Gate 1 results. Next: Follow short grouped Gate 1 checklist. Owner: Hristo / qualified adviser / provider.
- **SIG-001** (Sign-off): TECHNICAL ACTIVATION GATE BLOCKED; legal identity pending; account absent. Next: Stop at Gate 1; no auto-merge/deploy/activation. Owner: Hristo / qualified adviser / provider.
- **PRI-003-R** (Privacy & Storage): Runtime storage/cookie enumeration unavailable in the browser read-only DOM capability; source inventory verified separately. Next: Human inspects DevTools Application storage/cookies and Network response Set-Cookie on fresh visits and triggered security flows. Owner: Hristo / qualified adviser / provider.

## Not run: 0


## Prior product gate (separate record)

ORB012, REA022, REA024, OAD005, OAD006, RAD011, MOB027, MOB033. Preserve historical evidence; no automatic Pass from merged PR21.
