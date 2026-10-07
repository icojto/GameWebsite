# OdesosGames monetization requirements v1

Research snapshot: 7 October 2026. This matrix precedes production source edits. Classification separates law, provider obligations, project requirements and optional hardening. No worldwide compliance guarantee.

TECHNICAL ACTIVATION GATE BLOCKED. Product record: 316 Pass, 8 Fail, 8 N/A; merge ef6694e42cb76e018c6702ff8937316ac625d2d2 is deployed but human closure is absent. Exact public legal identity is pending.

## LEG-001: Publish approved legal operator name, permanent address, different activity address if applicable, telephone and email before the planned ad-funded release.

- Class: MANDATORY; applies: YES.
- Sources: [BG01: Bulgarian Electronic Commerce Act, consolidated 3 February 2026](https://www.mi.government.bg/file/2026/05/zet_03_02_26.pdf), [EU01: CJEU Papasavvas, C-291/13](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A62013CJ0291).
- Current state: Individual Bulgaria; exact public identity/address/phone absent.
- Required action: Hristo supplies and approves minimum public values or obtains qualified advice on lawful disclosure.
- Verification: Review Articles 3–4 against exact public Contact/operator information.

## LEG-002: Disclose registration, licensing, professional or VAT facts only when applicable.

- Class: CONDITIONAL; applies: CONDITIONAL.
- Sources: [BG01: Bulgarian Electronic Commerce Act, consolidated 3 February 2026](https://www.mi.government.bg/file/2026/05/zet_03_02_26.pdf).
- Current state: No registered company claimed; VAT/licensing facts not supplied.
- Required action: Confirm applicability; never invent registration or VAT ID.
- Verification: Human declaration / qualified review.

## LEG-003: Provide the approved public contact email.

- Class: MANDATORY; applies: YES.
- Sources: [BG01: Bulgarian Electronic Commerce Act, consolidated 3 February 2026](https://www.mi.government.bg/file/2026/05/zet_03_02_26.pdf), U01: user-authored Prompt 5.
- Current state: Live Contact omits contact@odesosgames.com.
- Required action: Replace outdated contact text with approved mailto link.
- Verification: Live and candidate DOM link inspection.

## LEG-004: Verify mailbox receipt and reply.

- Class: MANDATORY; applies: YES.
- Sources: U01: user-authored Prompt 5.
- Current state: No delivery test; DNS lookup found no MX answer, only SOA.
- Required action: Human verifies mail routing and performs external receipt/reply test.
- Verification: Timestamped receipt and reply; redact personal details.

## LEG-005: Validate free-service Terms, mandatory consumer rights, liability, governing law and English language sufficiency.

- Class: UNKNOWN / HUMAN OR PROVIDER CONFIRMATION; applies: UNKNOWN.
- Sources: [BG04: Consumer Protection Act September 2026 amendment](https://dv.parliament.bg/DVWeb/showMaterialDV.jsp?idMat=245888), [BG01: Bulgarian Electronic Commerce Act, consolidated 3 February 2026](https://www.mi.government.bg/file/2026/05/zet_03_02_26.pdf).
- Current state: September 2026 consumer amendment identified; full applicability not legally settled.
- Required action: Qualified Bulgarian review before releasing Terms; no blanket waiver/arbitration.
- Verification: Document reviewed current legal basis and approved text.

## LEG-006: Purchase checkout, prices and real-money/gambling terms.

- Class: NOT APPLICABLE; applies: NO.
- Sources: U01: user-authored Prompt 5.
- Current state: No purchases, monetary gameplay or gambling in v1.
- Required action: Reassess if business model changes.
- Verification: Approved facts and source audit.

## PRI-001: Publish factual privacy notice with controller, purposes, basis, recipients, retention criteria, applicable rights and complaint route.

- Class: MANDATORY; applies: YES.
- Sources: [EU03: GDPR transparency and rights, regulator reproduction](https://www.cnil.fr/fr/reglement-europeen-protection-donnees/chapitre3), [H01: What is GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages), [H05: Cloudflare Privacy Policy](https://www.cloudflare.com/privacypolicy/).
- Current state: Privacy route absent; identity/provider operational facts incomplete.
- Required action: Prepare internal draft; release only after identity and actual retention/basis decisions.
- Verification: Review public notice against data-flow register.

## PRI-002: Assess terminal storage purpose by purpose; do not label all persistent saves strictly necessary.

- Class: MANDATORY; applies: YES.
- Sources: [BG01: Bulgarian Electronic Commerce Act, consolidated 3 February 2026](https://www.mi.government.bg/file/2026/05/zet_03_02_26.pdf), [EU05: Opinion 04/2012 on Cookie Consent Exemption](https://ec.europa.eu/justice/article-29/documentation/opinion-recommendation/files/2012/wp194_en.pdf), [EU06: EDPB Guidelines 2/2023, technical scope of Article 5(3)](https://www.edpb.europa.eu/documents/guideline/guidelines-22023-on-technical-scope-of-art-53-of-eprivacy-directive_en).
- Current state: Orbit profile initial save and indefinite local progression observed in source.
- Required action: Resolve explicit-request/necessity and retention assessment; gate non-exempt storage before use if required.
- Verification: Qualified assessment plus browser storage tests.

## PRI-003: Inventory production, hidden embeds, migrations, DEV and QA storage separately.

- Class: MANDATORY; applies: YES.
- Sources: U01: user-authored Prompt 5, [EU02: GDPR principles, regulator reproduction](https://www.cnil.fr/fr/reglement-europeen-protection-donnees/chapitre2).
- Current state: Source inventory records 11 production key patterns plus DEV/QA scope.
- Required action: Keep inventory current for changes.
- Verification: Storage source paths and triggers in register.

## PRI-004: No analytics/accounts/newsletter/purchases/UGC/visitor OpenAI processing in v1.

- Class: MANDATORY; applies: YES.
- Sources: U01: user-authored Prompt 5.
- Current state: Source and bounded live assets show none of these integrations.
- Required action: Preserve restrictions.
- Verification: Repository search plus observed asset inventories.

## PRI-005: Provide applicable privacy rights and CPDP complaint information.

- Class: MANDATORY; applies: YES.
- Sources: [EU03: GDPR transparency and rights, regulator reproduction](https://www.cnil.fr/fr/reglement-europeen-protection-donnees/chapitre3), [BG02: CPDP complaints and alerts](https://cpdp.bg/en/lodging-complaints-and-alerts/).
- Current state: No public privacy notice.
- Required action: Add only with approved notice; local saves cannot be remotely recovered by operator.
- Verification: Review notice, rights contact and authority link.

## PRI-006: Determine actual processing roles, retention, security and transfer safeguards for hosting/CDN/contact.

- Class: MANDATORY; applies: YES.
- Sources: [EU02: GDPR principles, regulator reproduction](https://www.cnil.fr/fr/reglement-europeen-protection-donnees/chapitre2), [EU04: GDPR controller obligations, regulator reproduction](https://www.cnil.fr/fr/reglement-europeen-protection-donnees/chapitre4), [H02: GitHub General Privacy Statement](https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement), [H07: Cloudflare Customer DPA](https://www.cloudflare.com/cloudflare-customer-dpa/).
- Current state: CDN and GitHub confirmed; mail provider and owner retention unknown.
- Required action: Human confirms agreements/settings, legitimate-interest assessment where relied on, and email retention.
- Verification: Approved data-flow register and actual contracts/settings.

## PRI-007: Assess breach procedure, records, DPO and DPIA requirements proportionately.

- Class: CONDITIONAL; applies: CONDITIONAL.
- Sources: [EU04: GDPR controller obligations, regulator reproduction](https://www.cnil.fr/fr/reglement-europeen-protection-donnees/chapitre4).
- Current state: No evidence of high-risk visitor processing or large-scale monitoring.
- Required action: Document applicability; appropriate incident/rights procedure still required.
- Verification: Qualified risk assessment; do not invent mandatory DPO.

## PRI-008: Review known-child/child-directed rules if triggered.

- Class: CONDITIONAL; applies: CONDITIONAL.
- Sources: [BG03: CPDP legal grounds brochure](https://cpdp.bg/userfiles/file/Documents_2020/Brochure_Legal%20Ground_2020.pdf), [BG05: Personal Data Protection Act, government-hosted June 2025 consolidation](https://saref.government.bg/sites/default/files/2025-06/%D0%97%D0%90%D0%9A%D0%9E%D0%9D%20%D0%97%D0%90%20%D0%97%D0%90%D0%A9%D0%98%D0%A2%D0%90%20%D0%9D%D0%90%20%D0%9B%D0%98%D0%A7%D0%9D%D0%98%D0%A2%D0%95%20%D0%94%D0%90%D0%9D%D0%9D%D0%98%20%D0%BA%D1%8A%D0%BC%20%D1%8E%D0%BD%D0%B8%202025.pdf), [G25: Child-directed treatment](https://support.google.com/policies/answer/9664901?hl=en), U01: user-authored Prompt 5.
- Current state: General audience approved; no account/age collection; BG Article 25c read in government-hosted consolidation.
- Required action: Do not add age gate without requirement; verify full current BG act and actual applicability before child-specific processing.
- Verification: Audience and current law/provider review.

## CMP-001: Use Google-certified TCF 2.3 CMP for applicable regional advertising.

- Class: CONDITIONAL; applies: CONDITIONAL.
- Sources: [G05: EU User Consent Policy](https://www.google.com/about/company/user-consent-policy/), [G06: Google-certified CMP requirements](https://support.google.com/adsense/answer/13554020?hl=en-GB), [G07: TCF 2.3 transition](https://support.google.com/adsense/answer/16942036?hl=en-GB), [G08: Google TCF integration](https://support.google.com/adsense/answer/9999955?hl=en).
- Current state: No account, message or advertising tag active.
- Required action: Human configures preferred Google CMP after account and release-ready privacy URL.
- Verification: Actual message, TCF 2.3 signals/vendor configuration.

## CMP-002: Meaningful choices including Do not consent and management; no analytics purpose.

- Class: MANDATORY; applies: YES.
- Sources: [G09: Create a European regulations message](https://support.google.com/adsense/answer/10960768?hl=en-2), U01: user-authored Prompt 5.
- Current state: No active CMP.
- Required action: Human reviews and publishes choices/language/vendors.
- Verification: Dashboard configuration evidence and first-visit test.

## CMP-003: CMP is top-level; H5 runs inside canvas document.

- Class: CONDITIONAL; applies: CONDITIONAL.
- Sources: [G10: CMP display and Referrer-Policy troubleshooting](https://support.google.com/adsense/answer/14660912?hl=en), [G18: HTML5 game structure](https://developers.google.com/ad-placement/docs/html5-game-structure).
- Current state: Portal hosts same-origin game iframe and current host ad bridge.
- Required action: Design actual consent propagation and game-document adapter at later approved integration.
- Verification: Provider-supported top/iframe signal tests; matching publisher account.

## CMP-004: Visible Privacy and cookie settings entry reopens supported CMP; absent API has truthful fallback.

- Class: MANDATORY; applies: YES.
- Sources: [G11: Funding Choices JavaScript API](https://developers.google.com/funding-choices/fc-api-docs), [EU02: GDPR principles, regulator reproduction](https://www.cnil.fr/fr/reglement-europeen-protection-donnees/chapitre2).
- Current state: Entry absent on live site.
- Required action: Add safe entry/fallback now; future API hook must not assert consent.
- Verification: Click without SDK, no network/crash; later regional CMP revoke test.

## CMP-005: Refusal does not automatically permit NPA or cookie-free limited ads.

- Class: CONDITIONAL; applies: CONDITIONAL.
- Sources: [G12: Personalised and non-personalised ads](https://support.google.com/adsense/answer/9007336?hl=en), [G13: Limited ads](https://support.google.com/adsense/answer/14210870?hl=en), [G14: Ad serving settings](https://support.google.com/adsense/answer/3234887?hl=en).
- Current state: No advertising enabled.
- Required action: Human reviews limited-ad IVT storage settings and justified consent/basis path.
- Verification: Actual account setting plus rejected-consent network/storage trace.

## CMP-006: Keep games usable without personalisation consent and during CMP failure.

- Class: MANDATORY; applies: YES.
- Sources: U01: user-authored Prompt 5, [G05: EU User Consent Policy](https://www.google.com/about/company/user-consent-policy/).
- Current state: Production Null used; no CMP dependency currently.
- Required action: Preserve fail-open game use; verify real CMP later.
- Verification: Null regression and later consent/failure scenarios.

## ADS-001: Human creates one eligible individual account in Bulgaria.

- Class: MANDATORY; applies: YES.
- Sources: [G01: AdSense eligibility](https://support.google.com/adsense/answer/9724?hl=en), U01: user-authored Prompt 5.
- Current state: Approved baseline: no existing/prior account, no suspension. Age eligibility unconfirmed.
- Required action: Human confirms 18+ and accepts terms directly; no secrets here.
- Verification: Account status only; no identity documents.

## ADS-002: Add domain and complete ownership/site review using actual public values.

- Class: MANDATORY; applies: YES.
- Sources: [G02: Add and verify a site](https://support.google.com/adsense/answer/12169212?hl=en).
- Current state: No account/site submission.
- Required action: Prefer available meta verification before ad script; actual account instructions control.
- Verification: Actual site status and public verification evidence.

## ADS-003: Content, accurate privacy and invalid-traffic controls meet provider policy.

- Class: MANDATORY; applies: YES.
- Sources: [G03: Google Publisher Policies](https://support.google.com/adsense/answer/10502938?hl=en), [G04: AdSense Program Policies](https://support.google.com/adsense/answer/48182?hl=en).
- Current state: Original games present; public legal/privacy/contact gaps remain.
- Required action: Close verified site gaps before review; never click own ads.
- Verification: Policy review, provider feedback and human traffic-control procedures.

## ADS-004: No sample/public publisher ID or active provider script before approval.

- Class: MANDATORY; applies: YES.
- Sources: U01: user-authored Prompt 5.
- Current state: No provider SDK/configuration in current production.
- Required action: Keep production Null until explicit final approval.
- Verification: Source/build guard and bounded live assets.

## H5-001: H5 needs separate application and approved access.

- Class: MANDATORY; applies: YES.
- Sources: [G15: H5 application](https://support.google.com/adsense/answer/1705831?hl=en-GB), [G16: H5 application form](https://adsense.google.com/start/h5-game-ads-apply/).
- Current state: NOT SUBMITTED per approved baseline.
- Required action: Human applies after AdSense account exists; individual form ambiguity goes to Google.
- Verification: Actual NOT SUBMITTED/PENDING/APPROVED/REJECTED state.

## H5-002: Place H5 SDK and adBreak calls in game canvas document.

- Class: CONDITIONAL; applies: CONDITIONAL.
- Sources: [G18: HTML5 game structure](https://developers.google.com/ad-placement/docs/html5-game-structure).
- Current state: No SDK; host bridge currently owns abstract ad service.
- Required action: Prepare disabled boundary; implement game-document adapter only after approval.
- Verification: No portal-only SDK shortcut; actual embedded-game verification.

## H5-003: Unconfigured real adapter must load no SDK and fall back safely.

- Class: MANDATORY; applies: YES.
- Sources: U01: user-authored Prompt 5.
- Current state: Production Null is existing safe default.
- Required action: Prepare disabled GoogleH5Adapter without requests; retain Null runtime.
- Verification: Unit/static production build and SDK absence.

## H5-004: Use supported test mode and avoid invalid live impressions/clicks.

- Class: CONDITIONAL; applies: CONDITIONAL.
- Sources: [G21: Provider testing mode](https://developers.google.com/ad-placement/docs/test), [G04: AdSense Program Policies](https://support.google.com/adsense/answer/48182?hl=en).
- Current state: No real provider SDK or test configuration.
- Required action: Later controlled data-adbreak-test="on" integration; human/provider-safe live checks.
- Verification: Provider test callback logs; no revenue clicks.

## PLC-001: Startup fullscreen is off in v1 real ads.

- Class: MANDATORY; applies: YES.
- Sources: U01: user-authored Prompt 5, [G17: H5 Games Ads guidance](https://support.google.com/adsense/answer/9959170?hl=en).
- Current state: No real ads currently; DEV startup option is separate.
- Required action: Explicit disabled production policy retained in scaffold.
- Verification: Source configuration and later first-open test.

## PLC-002: Interstitials only at defensible natural transitions with conservative frequency.

- Class: MANDATORY; applies: YES.
- Sources: [G17: H5 Games Ads guidance](https://support.google.com/adsense/answer/9959170?hl=en), [G19: Placement types](https://developers.google.com/ad-placement/docs/placement-types).
- Current state: Orbit PLAY/RESTART and Reactor start/restart/pause semantics exist in mock lifecycle.
- Required action: Classify each real placement at 5J; pause remains conditional until defensible.
- Verification: KEEP/CHANGE/REMOVE per active real placement.

## PLC-003: No interruption, per-action ad, fullscreen chaining or navigation interference.

- Class: MANDATORY; applies: YES.
- Sources: [G17: H5 Games Ads guidance](https://support.google.com/adsense/answer/9959170?hl=en), U01: user-authored Prompt 5.
- Current state: Null serves none; real placement validation unavailable.
- Required action: Preserve rate policy and validate real provider timing later.
- Verification: Natural-transition and navigation tests with provider test mode.

## PLC-004: Courtesy screens remain DEV-only; banners must not cover controls or policy screens.

- Class: MANDATORY; applies: YES.
- Sources: U01: user-authored Prompt 5, [G03: Google Publisher Policies](https://support.google.com/adsense/answer/10502938?hl=en).
- Current state: DEV courtesy modules separated; no real banners.
- Required action: Keep separation and review any later banner proposal.
- Verification: Production guard plus actual placement layout.

## RWD-001: Explain non-cash reward before explicit opt-in; no penalty for declining.

- Class: MANDATORY; applies: YES.
- Sources: [G22: Rewarded inventory policy](https://support.google.com/adsense/answer/9121589?hl=en), U01: user-authored Prompt 5.
- Current state: Orbit revive and Reactor Cool/Upgrade retain mock/Null lifecycle.
- Required action: Review final provider-facing button copy before activation.
- Verification: Per-offer explanation and decline path with real test SDK.

## RWD-002: Reward only qualified completion, exactly once, never on no-fill/skip/failure/timeout.

- Class: MANDATORY; applies: YES.
- Sources: [G20: adBreak API](https://developers.google.com/ad-placement/apis/adbreak), [G22: Rewarded inventory policy](https://support.google.com/adsense/answer/9121589?hl=en), U01: user-authored Prompt 5.
- Current state: Existing deterministic suite covers normalised reward lifecycle; fresh suite pending.
- Required action: Run current regression now; actual provider callback mapping later.
- Verification: Reward lifecycle tests and later provider callback traces.

## RWD-003: Orbit run limits and Reactor +1 resources remain game-owned; no auto-use.

- Class: MANDATORY; applies: YES.
- Sources: U01: user-authored Prompt 5.
- Current state: Prior fix code merged; human product closure still absent.
- Required action: Recheck deterministic suite; preserve physical human gate.
- Verification: Regression plus physical evidence for open product IDs.

## TXT-001: Before public provider ID, publish no fabricated ads.txt entry.

- Class: MANDATORY; applies: YES.
- Sources: [G23: ads.txt guide](https://support.google.com/adsense/answer/12171612?hl=en-EN), U01: user-authored Prompt 5.
- Current state: No ID or ads.txt. READY / WAITING FOR PROVIDER ID.
- Required action: Keep absent until exact account entry supplied.
- Verification: Source/root artifact inventory.

## TXT-002: After ID, serve exact root plain-text authorised seller entry, factual DIRECT relationship and crawlability.

- Class: CONDITIONAL; applies: CONDITIONAL.
- Sources: [G23: ads.txt guide](https://support.google.com/adsense/answer/12171612?hl=en-EN).
- Current state: Provider ID absent.
- Required action: Generate from account data after approval; verify 200/plain text and recrawl.
- Verification: Actual root response/account status.

## TXT-003: Human selects sellers visibility after exact account identity exposure is shown.

- Class: MANDATORY; applies: YES.
- Sources: [G24: sellers.json visibility](https://support.google.com/adsense/answer/9889911?hl=en-GB), U01: user-authored Prompt 5.
- Current state: No account; selection intentionally deferred.
- Required action: Show actual payments name, seller ID/domain and current revenue consideration; then ask.
- Verification: Explicit Transparent/Confidential answer; no inference.

## SEC-001: Verify production HTTPS and actual proxy role.

- Class: MANDATORY; applies: YES.
- Sources: [H04: Cloudflare response-header transforms](https://developers.cloudflare.com/rules/transform/response-header-modification/).
- Current state: HTTPS browser access; Cloudflare A/NS/Server plus GitHub edge headers observed.
- Required action: Keep HTTPS and document configuration ownership.
- Verification: live-headers.json, dns-a.json, dns-ns.json.

## SEC-002: Add and verify appropriate HSTS at actual response edge.

- Class: RECOMMENDED; applies: YES.
- Sources: [H04: Cloudflare response-header transforms](https://developers.cloudflare.com/rules/transform/response-header-modification/).
- Current state: HSTS absent in audited GET.
- Required action: Human confirms SSL/redirect/hostname coverage; add conservative max-age only after validation.
- Verification: Fresh response headers and HTTPS checks.

## SEC-003: Add nosniff and least-privilege Permissions-Policy.

- Class: RECOMMENDED; applies: YES.
- Sources: [H04: Cloudflare response-header transforms](https://developers.cloudflare.com/rules/transform/response-header-modification/).
- Current state: Both headers absent in audited GET.
- Required action: Human Cloudflare response-header rules; avoid restricting needed fullscreen/autoplay.
- Verification: Fresh site/game/embed headers and playable games.

## SEC-004: Use explicit strict-origin-when-cross-origin referrer policy.

- Class: RECOMMENDED; applies: YES.
- Sources: [G10: CMP display and Referrer-Policy troubleshooting](https://support.google.com/adsense/answer/14660912?hl=en), [H04: Cloudflare response-header transforms](https://developers.cloudflare.com/rules/transform/response-header-modification/).
- Current state: No response Referrer-Policy; browser default not explicit site control.
- Required action: Safe meta improvement now; edge header human task.
- Verification: Candidate DOM and later production headers.

## SEC-005: Deploy measured CSP without wildcard origin allowances or blocking CMP/H5.

- Class: RECOMMENDED; applies: YES.
- Sources: [H04: Cloudflare response-header transforms](https://developers.cloudflare.com/rules/transform/response-header-modification/), [G18: HTML5 game structure](https://developers.google.com/ad-placement/docs/html5-game-structure), [G10: CMP display and Referrer-Policy troubleshooting](https://support.google.com/adsense/answer/14660912?hl=en).
- Current state: No CSP header. Provider origins not yet observed.
- Required action: Begin dashboard report-only self baseline; review reports and precise provider origins before enforcing.
- Verification: Report-only response, reports and approved SDK validation.

## SEC-006: Set frame-ancestors according to intended embedding/distribution.

- Class: CONDITIONAL; applies: CONDITIONAL.
- Sources: [H04: Cloudflare response-header transforms](https://developers.cloudflare.com/rules/transform/response-header-modification/), U01: user-authored Prompt 5.
- Current state: Same-origin portal embeds games; future external distribution undecided.
- Required action: Human decides embedding scope; use response header, not meta frame-ancestors.
- Verification: Direct/host/authorised external embedding tests.

## SEC-007: Validate postMessage origin, frame source, version, game and request scope.

- Class: MANDATORY; applies: YES.
- Sources: U01: user-authored Prompt 5.
- Current state: Existing bridge validates same-origin frame protocol and allowlist.
- Required action: Run bridge regression.
- Verification: Current tests plus source audit.

## NET-001: Bounded live assets contain no analytics, ad or CMP SDK requests.

- Class: MANDATORY; applies: YES.
- Sources: U01: user-authored Prompt 5.
- Current state: Home and Orbit asset observations are same-origin.
- Required action: Inspect Reactor as well; conditional CDN/security flows documented separately.
- Verification: Saved asset lists, source scan; not an exhaustive packet capture.

## NET-002: Describe Cloudflare conditional cookies and NEL error-report endpoint honestly.

- Class: MANDATORY; applies: YES.
- Sources: [H05: Cloudflare Privacy Policy](https://www.cloudflare.com/privacypolicy/), [H06: Cloudflare cookies](https://developers.cloudflare.com/fundamentals/reference/policies-compliances/cloudflare-cookies/).
- Current state: Report-To/NEL advertise a.nel.cloudflare.com with success_fraction=0; no report POST observed.
- Required action: Record conditional report flow; max_age is configuration lifetime, not log retention.
- Verification: Actual header evidence and owner settings.

## NET-003: Confirm hosting terms permit the intended ad-funded online business.

- Class: UNKNOWN / HUMAN OR PROVIDER CONFIRMATION; applies: UNKNOWN.
- Sources: [H03: GitHub Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits).
- Current state: Pages commercial-use restriction found; classification not resolved.
- Required action: Human gets written GitHub clarification or selects appropriate hosting before monetization.
- Verification: Written determination or verified migration.

## NET-004: Validate public route metadata, sitemap, robots and safe 404.

- Class: MANDATORY; applies: YES.
- Sources: U01: user-authored Prompt 5.
- Current state: Five public routes; three hidden catalog embeds built but not listed.
- Required action: Check route assets and public live resources.
- Verification: Source/build verify-pages and observed routes.

## NET-005: Playgama is inquiry only and no second provider is activated.

- Class: MANDATORY; applies: YES.
- Sources: [P01: Playgama Ad getting started](https://wiki.playgama.com/playgama/playgama-ad/getting-started), [P02: Playgama Ad standalone](https://wiki.playgama.com/playgama/playgama-ad/standalone-solution), U01: user-authored Prompt 5.
- Current state: No SDK/client ID; access absent.
- Required action: Prepare inquiry on access, privacy/CMP, vendor roles and exclusivity.
- Verification: Source/asset scan and human-owned unsent inquiry.

## MOB-001: Candidate Contact/settings entry is readable and accessible at narrow viewport.

- Class: MANDATORY; applies: YES.
- Sources: U01: user-authored Prompt 5.
- Current state: Safe changes not implemented yet.
- Required action: Verify responsive layout and keyboard focus locally.
- Verification: Browser screenshot and semantic controls at 390px.

## MOB-002: Actual ads fit player, preserve controls, input and audio on physical Android/iOS.

- Class: CONDITIONAL; applies: CONDITIONAL.
- Sources: [G17: H5 Games Ads guidance](https://support.google.com/adsense/answer/9959170?hl=en), [G22: Rewarded inventory policy](https://support.google.com/adsense/answer/9121589?hl=en), U01: user-authored Prompt 5.
- Current state: No real SDK; physical devices unavailable to AI.
- Required action: Human performs actual provider-safe physical QA after approvals.
- Verification: Device/browser/orientation plus PASS/FAIL/BLOCKED and visual evidence.

## FAIL-001: Null/unavailable provider settles without game lock or reward.

- Class: MANDATORY; applies: YES.
- Sources: U01: user-authored Prompt 5.
- Current state: Current fresh regression pending.
- Required action: Run existing deterministic lifecycle suite.
- Verification: Current test logs; real provider failures remain separate.

## FAIL-002: Actual CMP/SDK blocked, offline, timeout, no-fill, revoked consent safely resume.

- Class: CONDITIONAL; applies: CONDITIONAL.
- Sources: [G20: adBreak API](https://developers.google.com/ad-placement/apis/adbreak), U01: user-authored Prompt 5.
- Current state: No approved SDK integration.
- Required action: Later targeted provider test-mode checks without repeated unavailable attempts.
- Verification: Callback traces, input/audio/reward evidence.

## HUM-001: Identity, agreements, account creation, tax/bank and deployment are human-owned.

- Class: MANDATORY; applies: YES.
- Sources: U01: user-authored Prompt 5.
- Current state: No automated submission or agreement acceptance.
- Required action: Gate package contains only public values and explicit secret warning.
- Verification: Review checklist and values template.

## HUM-002: Human configures CMP, limited-ad decisions and actual seller choice.

- Class: MANDATORY; applies: YES.
- Sources: [G09: Create a European regulations message](https://support.google.com/adsense/answer/10960768?hl=en-2), [G14: Ad serving settings](https://support.google.com/adsense/answer/3234887?hl=en), [G24: sellers.json visibility](https://support.google.com/adsense/answer/9889911?hl=en-GB).
- Current state: Account absent; no dashboard settings changed.
- Required action: Complete ordered checklist after legal/product prerequisites.
- Verification: Public statuses/settings evidence; no secrets.

## HQA-001: Close prior product gate with actual human results.

- Class: MANDATORY; applies: YES.
- Sources: U01: user-authored Prompt 5.
- Current state: Historical workbook remains 316 Pass / 8 Fail / 8 N/A. PR21 merged/live ef6694e does not close evidence.
- Required action: Supply product retest evidence for ORB012, REA022, REA024, OAD005, OAD006, RAD011, MOB027, MOB033.
- Verification: Updated human workbook and evidence.

## HQA-002: Human verifies exact legal facts, mailbox, readability, settings, games and mobile appearance.

- Class: MANDATORY; applies: YES.
- Sources: U01: user-authored Prompt 5.
- Current state: No human Gate 1 results.
- Required action: Follow short grouped Gate 1 checklist.
- Verification: PASS/FAIL/BLOCKED with device/date and requested evidence.

## SIG-001: Never declare monetization ready before legal/product/provider/QA/explicit activation gates.

- Class: MANDATORY; applies: YES.
- Sources: U01: user-authored Prompt 5.
- Current state: TECHNICAL ACTIVATION GATE BLOCKED; legal identity pending; account absent.
- Required action: Stop at Gate 1; no auto-merge/deploy/activation.
- Verification: Gate report and actual approval evidence.

## SIG-002: Preserve product QA input and maintain separate monetization workbook.

- Class: MANDATORY; applies: YES.
- Sources: U01: user-authored Prompt 5.
- Current state: Original product workbook left untouched.
- Required action: Save separate 20-sheet workbook with verified-only formulas.
- Verification: Hash preservation and workbook validation.

## Research limitations

EUR-Lex GDPR/ePrivacy full-text retrieval redirected or requested bot verification; no repeated bypass attempts were made. GDPR text was verified through CNIL regulator reproduction, and ePrivacy scope through regulator guidance and the current Bulgarian Act. A government-hosted June 2025 PDP Act consolidation was subsequently read, including Articles 1, 6 and 25c; completeness of later amendments still requires confirmation before child-specific processing. A fresh September 2026 consumer-law amendment was read; final free-service Terms, consumer scope and language require qualified Bulgarian review. Playgama consent/exclusivity details are not established by its technical API page. No account approval, vendor contract, log retention or mailbox functionality is inferred.
