# Security and production v1

Audited HTTPS GET on 7 October 2026 returned 200 via Cloudflare with GitHub/Fastly origin headers. CSP, HSTS, Referrer-Policy, Permissions-Policy, X-Content-Type-Options and X-Frame-Options were absent in that response. Access-Control-Allow-Origin:* on public static content is CORS, not CSP, and is not automatically a vulnerability. One initial sandbox DNS/HTTP attempt failed; only the later successful response is evidence.

Candidate code adds meta referrer=strict-origin-when-cross-origin. This does not set HSTS, nosniff or frame-ancestors. No ignored fake _headers file is introduced. Actual hardening requires Cloudflare dashboard access; no dashboard settings were changed.

Human steps, after preserving current working DNS/SSL:

1. In the Cloudflare zone odesosgames.com, verify the records serving this hostname are proxied and SSL mode/HTTPS redirects work to the verified origin. Do not downgrade encryption.
2. Rules → Transform Rules → Modify Response Header (current UI wording may vary). Create a rule scoped to this hostname, including portal and embed assets. Set X-Content-Type-Options: nosniff and Referrer-Policy: strict-origin-when-cross-origin. Save screenshots, then verify real response headers.
3. Set Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(). Preserve required autoplay/fullscreen; verify both games. Browser support differs.
4. After testing HTTPS for this hostname and any relevant subdomains, consider Strict-Transport-Security: max-age=86400 initially. Extend only after validation. Do not automatically add includeSubDomains/preload before their consequences are reviewed.
5. Begin Content-Security-Policy-Report-Only with a measured no-provider baseline such as default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'. Record actual violations before enforcing. Existing dynamic inline styling requires review. A report-only header without a report endpoint can be inspected in browser diagnostics; do not pretend reports are collected if no endpoint is configured.
6. Decide whether external game distribution/embedding is intended. frame-ancestors must be a response directive, not meta. 'self' permits current portal embedding but prohibits external hosts. Do not globally add DENY without reviewing distribution.
7. Future provider/CMP integration must supply a measured exact origin list for script/frame/connect/image requests. Add only justified origins; never '*' to make ads work. Recheck Google top-level CMP/referrer eligibility and game-document H5 behavior.
8. Review NEL/error reporting settings and applicable processing/retention; do not confuse configuration max_age with log lifetime. Cloudflare cookies are conditional on products/challenges, not automatically present.

Verification: fresh successful GET headers for homepage, contact and each game/embed; report-only diagnostics; browser readiness, fullscreen/audio, no unexpected provider origins. Header rules are RECOMMENDED security hardening, with embedding/provider requirements conditional. No legal guarantee follows from these headers.

Sources: [Cloudflare response-header transforms](https://developers.cloudflare.com/rules/transform/response-header-modification/), [Google message troubleshooting](https://support.google.com/adsense/answer/14660912?hl=en), source register H04–H07.
