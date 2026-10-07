import test from 'node:test';
import assert from 'node:assert/strict';
import { requestPrivacySettings } from '../src/site/privacy-settings.mjs';
import { GoogleH5Adapter } from '../src/ads/google-h5-adapter.ts';

test('privacy entry remains usable without CMP and reports provider failures without recording consent', () => {
  assert.equal(requestPrivacySettings({}), 'unavailable');
  assert.equal(requestPrivacySettings({googlefc:{showRevocationMessage(){throw Error('blocked')}}}), 'failed');
  let called=0;
  const host={googlefc:{showRevocationMessage(){assert.equal(this,host.googlefc);called++}}};
  assert.equal(requestPrivacySettings(host), 'requested');
  assert.equal(called,1);
  assert.deepEqual(Object.keys(host),['googlefc']);
});
test('Google preparation cannot serve ads or grant rewards before approval', async () => {
  const provider=new GoogleH5Adapter();
  await provider.initialize();
  assert.equal(provider.isReady(),false);
  assert.equal(await provider.prepareAd(),'unavailable');
  assert.equal(await provider.showAd(),'unavailable');
  assert.equal(provider.showBanner(),false);
  assert.equal(provider.startupFullscreenEnabled,false);
  assert.equal(provider.courtesyEnabled,false);
});
