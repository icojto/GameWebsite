import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = fileURLToPath(new URL('../dist/', import.meta.url));
const forbidden = [
  'qa-confirmation', 'qa-inspection', 'qa-reset-namespace', 'odesos.qa.', 'VITE_QA_SESSION', 'Open Game DEV', 'QA FIXTURES', 'reactor-dev-', 'orbit-qa.', 'qa-game-launcher', 'seededRandom',
  'ODESOS AD DEV', 'MOCK AD', 'odesos-ad-dev', 'odesos-ad-overlay',
  'odesos-mock-banner', 'odesos.dev.ads.v1', 'odesos.dev.ads.v1.1', 'Sorry for the quick pause!',
  'Odesos ad courtesy preview', 'Advertisement simulation', 'ad-mascot-bob', 'MockAdAdapter',
  'ad-chibi', 'ad-mock', 'Ads Integration', 'odesos-chibi-mascot.svg',
  'ad-context-help', 'ad-help-button', 'STATUS SUMMARY', 'Skip — no reward',
  'pagead2.googlesyndication.com', 'imasdk.googleapis.com', 'doubleclick.net',
];
const identities=new Set();
let inspected = 0;
for (const entry of await readdir(dist, { recursive: true, withFileTypes: true })) {
  if (!entry.isFile()) continue;
  const filename = path.join(entry.parentPath, entry.name);
  const body = await readFile(filename, 'utf8');
  for (const token of forbidden) assert.ok(!body.includes(token), `Development ad code leaked into ${path.relative(dist, filename)}: ${token}`);
  if(entry.name.endsWith('.html')){const match=body.match(/name="odesos-build" content="([^"]+)"/);assert.ok(match,'Missing build metadata: '+filename);const meta=JSON.parse(match[1].replace(/&quot;/g,'"').replace(/&amp;/g,'&'));assert.deepEqual(Object.keys(meta).sort(),['dirty','id','mode','revision','schema']);assert.equal(meta.mode,'production');assert.equal(typeof meta.dirty,'boolean');assert.match(meta.id,/^[a-f0-9-]{36}$/);assert.match(meta.revision,/^[a-f0-9]{40}$/);identities.add(meta.id);}
  inspected++;
}
assert.equal(identities.size,1,'Mixed build identities');
const portalScripts = (await readdir(path.join(dist, 'assets'))).filter((name) => name.endsWith('.js'));
assert.ok(portalScripts.length, 'No production portal JS found');
const code = (await Promise.all(portalScripts.map((name) => readFile(path.join(dist, 'assets', name), 'utf8')))).join('\n');
assert.ok(code.includes('NULL'), 'Expected NullAdAdapter in production portal');
console.log(`Ad production boundary PASS: ${inspected} artifacts checked; Null provider present; mock UI, panel, courtesy and DEV config absent.`);
