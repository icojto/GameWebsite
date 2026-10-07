import test from 'node:test';
import assert from 'node:assert/strict';
import { requestPrivacySettings } from '../src/site/privacy-settings.mjs';
import { GoogleH5Adapter } from '../src/ads/google-h5-adapter.ts';
import { NullAdAdapter } from '../src/ads/null-adapter.ts';

test('AdSense ownership metadata does not activate an advertising provider', async () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const tags = html.match(/<meta\b[^>]*name="google-adsense-account"[^>]*>/g) ?? [];
  assert.deepEqual(tags, ['<meta name="google-adsense-account" content="ca-pub-7528917701173650">']);
  assert.equal(html.split('ca-pub-7528917701173650').length - 1, 1);
  assert.doesNotMatch(html, /<script\b[^>]*src=["'][^"']*(?:adsbygoogle|googlesyndication|imasdk|doubleclick|playgama)/i);
  const runtime = readFileSync(new URL('../src/ads/runtime.ts', import.meta.url), 'utf8');
  assert.match(runtime, /new AdService\(new NullAdAdapter\(\)\)/);
  const provider = new NullAdAdapter();
  await provider.initialize();
  assert.equal(provider.isReady(), false);
  assert.equal(await provider.showAd(), 'unavailable');
  assert.equal(provider.showBanner(), false);
});

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

import {publicLocalKeys, hiddenLocalKeys, clearPublicLocalData} from '../src/site/local-data.mjs';
import {scopedStorage} from '../shared/storage-scope.mjs';
import {readThemePreference, createSafeStorage} from '../src/site/storage.mjs';
import {identity, buildMetadata, websiteVersion} from '../scripts/build-identity.mjs';
import {readFileSync} from 'node:fs';
function memoryStore(){const data=new Map();return {getItem:key=>data.get(key)??null,setItem:(key,value)=>data.set(key,value),removeItem:key=>data.delete(key)};}
test('public reset removes exact public and legacy data while preserving hidden, test and unrelated sentinels',()=>{
 const storage=memoryStore();
 for(const key of publicLocalKeys)storage.setItem(key,'saved');
 const protectedKeys=[...hiddenLocalKeys,'odesos.dev.ads.v1.1','odesos.qa.another_session.odesos.theme','unrelated','odesos.player.reaction.signal-below'];
 for(const key of protectedKeys)storage.setItem(key,'keep');
 assert.equal(clearPublicLocalData(storage).ok,true);
 for(const key of publicLocalKeys)assert.equal(storage.getItem(key),null);
 for(const key of protectedKeys)assert.equal(storage.getItem(key),'keep');
 assert.equal(readThemePreference(createSafeStorage(()=>storage)),null,'legacy theme must not resurrect');
 assert.equal(clearPublicLocalData(storage).ok,true,'empty reset is idempotent');
});
test('QA clear affects only that session and honestly reports partial or denied removal',()=>{
 const raw=memoryStore();const a=scopedStorage(()=>raw,'gate2_session_A'),b=scopedStorage(()=>raw,'gate2_session_B');
 for(const key of publicLocalKeys){raw.setItem(key,'production');a.setItem(key,'disposable');b.setItem(key,'other session');}
 assert.equal(clearPublicLocalData(a).ok,true);
 for(const key of publicLocalKeys){assert.equal(a.getItem(key),null);assert.equal(raw.getItem(key),'production');assert.equal(b.getItem(key),'other session');}
 const denied={getItem(){throw Error('blocked')},removeItem(){throw Error('blocked')}};
 assert.equal(clearPublicLocalData(denied).ok,false);
 assert.equal(clearPublicLocalData(scopedStorage(()=>denied,'gate2_session_A')).ok,false);
 raw.setItem(publicLocalKeys[0],'locked');const partial={...raw,removeItem:key=>{if(key!==publicLocalKeys[0])raw.removeItem(key)}};
 assert.deepEqual(clearPublicLocalData(partial).failed,[publicLocalKeys[0]]);
});
test('website and build identities always use canonical package version, including supplied launcher metadata',()=>{
 const pkg=JSON.parse(readFileSync(new URL('../package.json',import.meta.url),'utf8'));
 assert.equal(websiteVersion,pkg.version);assert.equal(identity('production').version,pkg.version);
 const old=process.env.ODESOS_BUILD_META;process.env.ODESOS_BUILD_META=JSON.stringify({id:'test',version:'stale'});
 try{assert.equal(buildMetadata('production').version,pkg.version)}finally{if(old===undefined)delete process.env.ODESOS_BUILD_META;else process.env.ODESOS_BUILD_META=old}
 const source=readFileSync(new URL('../src/main.ts',import.meta.url),'utf8');assert.ok(source.includes('Website \u0024{__WEBSITE_VERSION__}'));
 assert.ok(!/Website \d+\.\d+\.\d+/.test(source));
});

import {ProfileStore, PROFILE_KEY, LEGACY_BEST_KEY as ORBIT_LEGACY} from '../games/orbit-break/src/game/profile.ts';
import {DEFAULT_CONFIG} from '../games/orbit-break/src/game/config.ts';
import {loadMute, saveMute, MUTE_KEY} from '../games/orbit-break/src/game/mute.ts';
import {recordScore, readScores, readBest, SCORE_KEY, LEGACY_BEST_KEY as REACTOR_LEGACY} from '../games/reactor-stack/src/storage.ts';
test('actual public game loaders boot fresh after clear without resurrecting legacy progress or mute',()=>{
 const storage=memoryStore();
 for(const key of [PROFILE_KEY,ORBIT_LEGACY,MUTE_KEY,SCORE_KEY,REACTOR_LEGACY])assert.ok(publicLocalKeys.includes(key));
 const profile=new ProfileStore(structuredClone(DEFAULT_CONFIG),storage);profile.setStars(100);storage.setItem(ORBIT_LEGACY,'420');saveMute(storage,true);
 recordScore({score:100,moves:2,result:'WIN'},storage,1);assert.equal(readBest(storage),100);
 assert.equal(clearPublicLocalData(storage).ok,true);
 const fresh=new ProfileStore(structuredClone(DEFAULT_CONFIG),storage);assert.equal(fresh.bestScore,0);assert.equal(loadMute(storage),false);assert.deepEqual(readScores(storage),[]);assert.equal(readBest(storage),0);
});

(await import('node:test')).default('public operator disclosure excludes residential contact fields', async () => {
 const {operatorHtml}=await import('../src/site/legal-content.mjs');
 const assert=(await import('node:assert/strict')).default;
 assert.equal(operatorHtml.includes('Hristo Aleksiev'),true);
 assert.equal(operatorHtml.includes('an individual in Bulgaria'),true);
 assert.equal(operatorHtml.includes('mailto:contact@odesosgames.com'),true);
 assert.equal(/tel:|<address>|\+\d[\d\s()-]{7,}|\b\d{4}\b/.test(operatorHtml),false);
});
