import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = fileURLToPath(new URL('../dist/', import.meta.url));
const forbidden = [
  'ODESOS AD DEV', 'MOCK AD', 'odesos-ad-dev', 'odesos-ad-overlay',
  'odesos-mock-banner', 'odesos.dev.ads.v1', 'odesos.dev.ads.v1.1', 'Sorry for the quick pause!',
  'Odesos ad courtesy preview', 'Advertisement simulation', 'ad-mascot-bob', 'MockAdAdapter',
];
let inspected = 0;
for (const entry of await readdir(dist, { recursive: true, withFileTypes: true })) {
  if (!entry.isFile() || !/\.(js|css|html|svg|map)$/.test(entry.name)) continue;
  const filename = path.join(entry.parentPath, entry.name);
  const body = await readFile(filename, 'utf8');
  for (const token of forbidden) assert.ok(!body.includes(token), `Development ad code leaked into ${path.relative(dist, filename)}: ${token}`);
  inspected++;
}
const portalScripts = (await readdir(path.join(dist, 'assets'))).filter((name) => name.endsWith('.js'));
assert.ok(portalScripts.length, 'No production portal JS found');
const code = (await Promise.all(portalScripts.map((name) => readFile(path.join(dist, 'assets', name), 'utf8')))).join('\n');
assert.ok(code.includes('NULL'), 'Expected NullAdAdapter in production portal');
console.log(`Ad production boundary PASS: ${inspected} artifacts checked; Null provider present; mock UI, panel, courtesy and DEV config absent.`);
