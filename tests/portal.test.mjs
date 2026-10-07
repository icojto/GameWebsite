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
    '/', '/games/orbit-break/', '/games/reactor-stack/', '/about/', '/contact/',
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
test('player allocation reserves measured controls at short/mobile heights without a giant minimum',()=>{
 for(const [height,bar] of [[280,58],[200,102],[360,58],[640,102],[1080,58]]){const available=playerAllocation(height,bar);assert.ok(available>=0);assert.ok(available+bar+16<=height);}
 assert.equal(playerAllocation(100,120),0);assert.equal(playerAllocation(280,58),206);
});
