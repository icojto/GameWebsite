import assert from 'node:assert/strict';
import test from 'node:test';
import { gameCatalog, publicGameCatalog } from '../src/games/catalog.mjs';
import { publicPages, siteOrigin } from '../src/site/pages.mjs';
import { createSafeStorage, readThemePreference } from '../src/site/storage.mjs';

test('only Games 001 and 002 are public', () => {
  assert.deepEqual(publicGameCatalog.map((game) => game.slug), ['orbit-break', 'reactor-stack']);
  assert.equal(publicGameCatalog.length, 2);
  assert.deepEqual(gameCatalog.filter((game) => game.visibility === 'hidden').map((game) => game.slug), [
    'last-relay', 'station-quartermaster', 'signal-below',
  ]);
});

test('route metadata follows the public catalog', () => {
  assert.deepEqual(publicPages.map((page) => page.path), [
    '/', '/games/orbit-break/', '/games/reactor-stack/', '/about/', '/contact/', '/privacy/', '/terms/',
  ]);
  assert.equal(new Set(publicPages.map((page) => page.title)).size, publicPages.length);
  for (const page of publicPages) {
    assert.ok(page.title && page.description);
    assert.ok(`${siteOrigin}${page.path}`.startsWith('https://odesosgames.com/'));
  }
});

test('site storage fails open when storage is restricted', () => {
  const unavailable = createSafeStorage(() => { throw new Error('denied'); });
  assert.equal(unavailable.get('missing', 'fallback'), 'fallback');
  assert.equal(unavailable.set('key', 'value'), false);
  assert.equal(unavailable.remove('key'), false);
  assert.equal(readThemePreference(unavailable), null);
});

test('legacy theme migrates once without deleting unrelated data', () => {
  const data = new Map([['studioArcade.theme', 'dark'], ['other.preference', 'keep']]);
  const storage = createSafeStorage(() => ({
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value),
    removeItem: (key) => data.delete(key),
  }));
  assert.equal(readThemePreference(storage), 'dark');
  assert.equal(data.get('odesos.theme'), 'dark');
  assert.equal(data.get('studioArcade.theme'), 'dark');
  assert.equal(data.get('other.preference'), 'keep');
  data.set('odesos.theme', 'light');
  assert.equal(readThemePreference(storage), 'light');
});


import { playerAllocation } from '../src/site/player-layout.mjs';
test('parser-blocking theme applies explicit/system/scoped preferences before portal module',async()=>{
 const {readFile}=await import('node:fs/promises');const {runInNewContext}=await import('node:vm');
 const source=await readFile(new URL('../public/theme-init.js',import.meta.url),'utf8');
 const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
 assert.ok(html.indexOf('src="/theme-init.js"')<html.indexOf('src="/src/main.ts"'));assert.ok(!html.match(/<script[^>]*(?:async|defer)[^>]*theme-init/));
 for(const [stored,system,expected] of [['dark',false,'dark'],['light',true,'light'],[null,true,'dark'],['invalid',false,'light']]){
  const attributes={};const root={dataset:{},style:{}};const reads=[];const context={window:{},document:{documentElement:root,querySelector:selector=>selector.includes('theme-storage-prefix')?{content:'odesos.qa.session_A.',dataset:{queryKey:'qa',session:'session_A'}}:{setAttribute:(k,v)=>attributes[k]=v}},location:{search:'?qa=session_A'},URLSearchParams,localStorage:{getItem:key=>{reads.push(key);return key.endsWith('odesos.theme')?stored:null;}},matchMedia:()=>({matches:system})};
  runInNewContext(source,context);assert.equal(root.dataset.theme,expected);assert.equal(root.style.colorScheme,expected);assert.equal(attributes.content,expected==='dark'?'#060a12':'#f4f7fb');assert.ok(reads.every(key=>key.startsWith('odesos.qa.session_A.')));
  context.window.odesosTheme.apply(expected==='dark'?'light':'dark');assert.notEqual(root.dataset.theme,expected);
 }
 const root={dataset:{},style:{}};runInNewContext(source,{window:{},document:{documentElement:root,querySelector:()=>null},location:{search:''},URLSearchParams,localStorage:{getItem(){throw Error('denied')}},matchMedia:()=>({matches:true})});assert.equal(root.dataset.theme,'dark');
});
test('player allocation accounts for every measured rectangle at the requested viewport matrix',()=>{
 for(const [width,height] of [[450,400],[500,400],[640,360],[720,400],[844,390],[932,430],[360,640],[390,844],[412,915],[1024,768],[1280,720],[1920,1080]]){
  const header=52,spacing=14,bar=width<=380?102:58,safe=8;
  assert.equal(playerAllocation(height,bar,header+spacing,safe)+header+spacing+bar+safe,height);
 }
});
test('player allocation reserves measured controls at short/mobile heights without a giant minimum',()=>{
 for(const [height,bar] of [[280,58],[200,102],[360,58],[640,102],[1080,58]]){const available=playerAllocation(height,bar,52,8);assert.ok(available>=0);assert.ok(available+bar+60<=height);}
 assert.equal(playerAllocation(100,120),0);assert.equal(playerAllocation(280,58,52,8),162);
});
