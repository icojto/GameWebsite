/** Calls the provider-supported revocation entry only when present. Never records consent. */
export function requestPrivacySettings(host) {
  try {
    if (typeof host?.googlefc?.showRevocationMessage !== 'function') return 'unavailable';
    host.googlefc.showRevocationMessage();
    return 'requested';
  } catch { return 'failed'; }
}
