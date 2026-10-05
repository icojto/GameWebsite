import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { AdService } from '../src/ads/service.ts';
import { NullAdAdapter } from '../src/ads/null-adapter.ts';
import { createAdBridge, parseAdMessage } from '../src/ads/bridge.ts';
import { normalizeConfig } from '../src/ads/model.ts';

let sequence = 0;
test('banner integration is outside iframe and after the player action bar', async () => {
  const source = await readFile(new URL('../src/main.ts', import.meta.url), 'utf8');
  const iframeEnd = source.indexOf('</iframe>');
  const actions = source.indexOf('data-frame-fullscreen');
  const slot = source.indexOf('<aside data-ad-slot="game-page-primary" hidden></aside>');
  const information = source.indexOf('<section class="game-information"');
  assert.ok(iframeEnd >= 0 && actions > iframeEnd && slot > actions && information > slot);
});

function harness(overrides = {}) {
  let time = 0;
  const calls = [];
  const provider = {
    name: 'TEST', initialize: async () => {}, isReady: () => true,
    prepareAd: async () => { calls.push('prepare'); return 'ready'; },
    showAd: async (_req, _signal, shown) => { calls.push('show'); shown(); return 'completed'; },
    showBanner: () => true, hideBanner() {}, destroy() {}, ...overrides,
  };
  const service = new AdService(provider, { development: true, now: () => time, timeoutMs: 25, courtesy: async () => { calls.push('courtesy'); } });
  service.setContext('test-game');
  for (const adType of ['startup', 'interstitial', 'rewarded']) service.register({ id: adType, gameId: 'test-game', adType, enabled: true, cooldownSeconds: 0, maxPerSession: 100, safeEvents: ['run-ended'] });
  const request = (adType, more = {}) => service.request({ requestId: `request-${++sequence}`, gameId: 'test-game', placementId: adType, adType, ...more });
  const advance = (seconds) => { time += seconds * 1000; service.tick(); };
  return { service, calls, request, advance };
}
test('Null adapter settles unavailable and cannot display anything', async () => {
  const provider = new NullAdAdapter();
  assert.equal(provider.isReady('startup'), false);
  assert.equal(await provider.prepareAd(), 'unavailable');
  assert.equal(await provider.showAd(), 'unavailable');
  assert.equal(provider.showBanner(), false);
  const h = harness(provider);
  h.service.provider = provider;
  assert.equal((await h.request('startup')).result, 'unavailable');
  assert.deepEqual(h.calls, []);
});
test('startup is attempted once per session and can reset in dev', async () => {
  const h = harness();
  assert.equal((await h.request('startup')).result, 'completed');
  assert.equal((await h.request('startup')).reason, 'startup-once-per-session');
  assert.deepEqual(h.service.startup, { requested: true, shown: true, completed: true });
  h.service.devAction('startup');
  assert.equal((await h.request('startup')).result, 'completed');
});
for (const outcome of ['failed', 'no_fill', 'timeout', 'unavailable']) {
  test(`startup ${outcome} settles fail-open without courtesy or show`, async () => {
    const h = harness({ prepareAd: async () => outcome });
    assert.equal((await h.request('startup')).result, outcome);
    assert.deepEqual(h.calls, []);
    assert.equal(h.service.busy, false);
  });
}
test('only visible playing time counts; eligibility never shows an ad', () => {
  const h = harness();
  h.service.setGameState('menu'); h.advance(200);
  h.service.setGameState('paused'); h.advance(200);
  h.service.setGameState('game-over'); h.advance(200);
  h.service.setGameState('playing'); h.service.setVisible(false); h.advance(200);
  assert.equal(h.service.activeSeconds, 0);
  h.service.setVisible(true); h.advance(180);
  assert.equal(h.service.activeSeconds, 180);
  assert.equal(h.service.interstitialEligibility().eligible, true);
  assert.equal(h.service.eligibleEvents, 1);
  assert.deepEqual(h.calls, []);
});
test('interstitial requires time and registered semantic event', async () => {
  const h = harness();
  assert.equal((await h.request('interstitial', { safeEvent: 'run-ended' })).reason, 'not-enough-active-play');
  h.service.devAction('eligible');
  assert.equal((await h.request('interstitial')).reason, 'no-safe-event');
  assert.equal((await h.request('interstitial', { safeEvent: 'arbitrary-click' })).reason, 'no-safe-event');
  assert.equal((await h.request('interstitial', { safeEvent: 'run-ended' })).result, 'completed');
});
test('interstitial interval, cooldown, and session cap work independently', async () => {
  const h = harness(); h.service.config.interstitial.maxPerSession = 1;
  h.service.devAction('eligible');
  await h.request('interstitial', { safeEvent: 'run-ended' });
  h.service.devAction('eligible');
  assert.equal((await h.request('interstitial', { safeEvent: 'run-ended' })).reason, 'session-cap');
  h.service.config.interstitial.maxPerSession = 3;
  assert.equal((await h.request('interstitial', { safeEvent: 'run-ended' })).reason, 'cooldown');
  h.advance(180);
  assert.equal((await h.request('interstitial', { safeEvent: 'run-ended' })).result, 'completed');
  assert.equal(h.service.interstitialEligibility().reason, 'not-enough-active-play');
});
test('rewarded requires explicit opt-in', async () => {
  const h = harness();
  assert.equal((await h.request('rewarded')).reason, 'explicit-request-required');
  assert.deepEqual(h.calls, []);
});
for (const outcome of ['completed', 'closed', 'failed', 'no_fill', 'timeout', 'unavailable', 'blocked']) {
  test(`reward result ${outcome} qualifies only completed`, async () => {
    const h = harness({ showAd: async (_req, _signal, shown) => { shown(); return outcome; } });
    const response = await h.request('rewarded', { userInitiated: true });
    assert.equal(response.rewardQualified, outcome === 'completed');
    assert.equal(h.service.acknowledge(response.requestId, 'test-game', 'rewarded'), outcome === 'completed');
    assert.equal(h.service.acknowledge(response.requestId, 'test-game', 'rewarded'), false);
  });
}
test('reward completion without actual showing cannot qualify', async () => {
  const h = harness({ showAd: async () => 'completed' });
  assert.equal((await h.request('rewarded', { userInitiated: true })).rewardQualified, false);
});
test('one fullscreen request at a time; deadline settles broken provider', async () => {
  const h = harness({ prepareAd: () => new Promise(() => {}) });
  const first = h.request('startup');
  assert.equal((await h.request('rewarded', { userInitiated: true })).reason, 'another-ad-active');
  assert.equal((await first).result, 'timeout');
  assert.equal(h.service.busy, false);
});
test('rewarded showing resets the interstitial cooldown by default', async () => {
  const h = harness(); h.service.devAction('eligible');
  await h.request('rewarded', { userInitiated: true });
  assert.equal((await h.request('interstitial', { safeEvent: 'run-ended' })).reason, 'cooldown');
  h.advance(180);
  assert.equal((await h.request('interstitial', { safeEvent: 'run-ended' })).result, 'completed');
});
test('courtesy follows readiness and precedes showing', async () => {
  const h = harness(); await h.request('startup');
  assert.deepEqual(h.calls, ['prepare', 'courtesy', 'show']);
});
test('route cancellation settles and does not grant rewards', async () => {
  const h = harness({ showAd: async (_r, signal, shown) => { shown(); return new Promise((resolve) => signal.addEventListener('abort', () => resolve('completed'))); } });
  const pending = h.request('rewarded', { userInitiated: true });
  await new Promise((resolve) => setImmediate(resolve));
  h.service.setContext('other-game');
  const response = await pending;
  assert.equal(response.rewardQualified, false);
  assert.equal(response.result, 'closed');
});
test('config clamps values, drops unknown keys and cannot persist mock garbage', () => {
  const config = normalizeConfig({ master: false, courtesy: { durationMs: -2 }, mock: { durationMs: Infinity, nextResult: '<script>' }, extra: true });
  assert.equal(config.master, false); assert.equal(config.courtesy.durationMs, 400);
  assert.equal(config.mock.durationMs, 5000); assert.equal(config.mock.nextResult, 'completed'); assert.equal(config.extra, undefined);
});
test('readiness exceptions and show timeouts settle without rewards', async () => {
  const failed = harness({ isReady: () => { throw new Error('provider broke'); } });
  assert.equal((await failed.request('startup')).result, 'unavailable');
  const timeout = harness({ showAd: (_request, _signal, shown) => { shown(); return new Promise(() => {}); } });
  const response = await timeout.request('rewarded', { userInitiated: true });
  assert.equal(response.result, 'timeout'); assert.equal(response.rewardQualified, false); assert.equal(timeout.service.busy, false);
});
test('placement enabled, cooldown and cap are enforced', async () => {
  const h = harness(); const placement = h.service.placements.get('rewarded'); placement.enabled = false;
  assert.equal((await h.request('rewarded', { userInitiated: true })).reason, 'disabled');
  placement.enabled = true; placement.cooldownSeconds = 10;
  await h.request('rewarded', { userInitiated: true });
  assert.equal((await h.request('rewarded', { userInitiated: true })).reason, 'placement-cooldown');
  h.advance(10); placement.maxPerSession = 1;
  assert.equal((await h.request('rewarded', { userInitiated: true })).reason, 'placement-cap');
});

test('zero placement cap blocks its first request', async () => {
  const h = harness(); h.service.placements.get('rewarded').maxPerSession = 0;
  assert.equal((await h.request('rewarded', { userInitiated: true })).reason, 'placement-cap');
  assert.deepEqual(h.calls, []);
});
test('clearing statistics does not reset session safety limits', async () => {
  const h = harness(); h.service.config.rewarded.maxPerSession = 1;
  await h.request('rewarded', { userInitiated: true }); h.service.clearStats();
  assert.equal(h.service.stats.rewarded.shown, 0);
  assert.equal((await h.request('rewarded', { userInitiated: true })).reason, 'session-cap');
});
test('banner visibility is independent and counts one impression per mount/show', () => {
  const h = harness(); const host = { hidden: true };
  h.service.config.banner.enabled = true; h.service.attachBanner(host);
  assert.equal(host.hidden, false); assert.equal(h.service.bannerVisible, true); assert.equal(h.service.stats.banner.shown, 1);
  h.service.setBanner(true); assert.equal(h.service.stats.banner.shown, 1);
  h.service.setBanner(false); assert.equal(host.hidden, true);
  h.service.setBanner(true); assert.equal(h.service.stats.banner.shown, 2);
  h.service.attachBanner(null); assert.equal(h.service.bannerVisible, false);
  h.service.provider = new NullAdAdapter(); h.service.attachBanner(host);
  assert.equal(host.hidden, true); assert.equal(h.service.bannerVisible, false);
});
const base = { protocol: 'odesos-ads', version: 1, requestId: 'one', gameId: 'test-game' };
test('bridge schema rejects malformed, unknown and excessive messages', () => {
  assert.equal(parseAdMessage({ ...base, type: 'game-state', state: new String('playing') }, 'test-game'), null);
  assert.equal(parseAdMessage({ ...base, type: 'ad-request', adType: ['rewarded'], placementId: 'rewarded' }, 'test-game'), null);
  for (const data of [null, [], {}, { ...base, type: 'unknown' }, { ...base, type: 'game-state', state: 'garbage' }, { ...base, type: 'game-ready', version: 2 }, { ...base, type: 'game-ready', requestId: 'x'.repeat(81) }, { ...base, type: 'game-ready', extra: true }, { ...base, type: 'ad-request', adType: 'rewarded', placementId: 'rewarded', userInitiated: 'true' }]) assert.equal(parseAdMessage(data, 'test-game'), null);
});

test('disposed bridge does not deliver a late ad result', async () => {
  const h = harness({ prepareAd: () => new Promise(() => {}) });
  const source = {}; const messages = [];
  const bridge = createAdBridge(h.service, { origin: 'https://odesosgames.com', source, gameId: 'test-game', send: (m) => messages.push(m) });
  bridge.receive({ origin: 'https://odesosgames.com', source, data: { ...base, type: 'ad-request', adType: 'startup', placementId: 'startup' } });
  bridge.dispose(); h.service.cancelActive('route-changed');
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(messages.map((m) => m.type), ['ad-accepted']);
  assert.equal(h.service.busy, false);
});

test('banner cleanup failure cannot break route cleanup', () => {
  const h = harness({ hideBanner: () => { throw new Error('broken cleanup'); } });
  const host = { hidden: false };
  h.service.bannerHost = host;
  assert.doesNotThrow(() => h.service.attachBanner(null));
  assert.equal(host.hidden, true);
  assert.equal(h.service.bannerVisible, false);
});
test('bridge authenticates source/origin/game and deduplicates requests and acknowledgments', async () => {
  const h = harness(); const source = {}; const messages = [];
  const bridge = createAdBridge(h.service, { origin: 'https://odesosgames.com', source, gameId: 'test-game', send: (m) => messages.push(m) });
  const data = { ...base, type: 'ad-request', adType: 'rewarded', placementId: 'rewarded', userInitiated: true };
  const event = { origin: 'https://odesosgames.com', source, data };
  bridge.receive({ ...event, origin: 'https://evil.example' }); bridge.receive({ ...event, source: {} }); bridge.receive({ ...event, data: { ...data, gameId: 'hidden-game' } });
  assert.equal(h.service.stats.rewarded.requests, 0);
  bridge.receive(event); bridge.receive(event);
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(messages.map((m) => m.type), ['ad-accepted', 'ad-will-show', 'ad-shown', 'ad-result']);
  assert.equal(messages.at(-1).rewardQualified, true);
  bridge.receive({ ...event, data: { ...base, requestId: 'wrong-ack', type: 'reward-granted', adRequestId: 'one', placementId: 'wrong-placement' } });
  assert.equal(h.service.rewardAcknowledgments, 0);
  bridge.receive({ ...event, data: { ...base, requestId: 'ack', type: 'reward-granted', adRequestId: 'one', placementId: 'rewarded' } });
  bridge.receive({ ...event, data: { ...base, requestId: 'ack2', type: 'reward-granted', adRequestId: 'one', placementId: 'rewarded' } });
  assert.equal(h.service.rewardAcknowledgments, 1);
  bridge.dispose(); bridge.receive({ ...event, data: { ...data, requestId: 'two' } });
  assert.equal(h.service.stats.rewarded.requests, 1);
});
