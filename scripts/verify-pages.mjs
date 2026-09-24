import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gameCatalog } from '../src/games/catalog.mjs';

const portalRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distRoot = path.join(portalRoot, 'dist');
const pagesBase = '/GameWebsite/';
const server = createServer(async (request, response) => {
  const pathname = new URL(request.url ?? '/', 'http://localhost').pathname;
  if (!pathname.startsWith(pagesBase)) {
    response.writeHead(404).end();
    return;
  }
  const relative = pathname.slice(pagesBase.length);
  const filename = path.resolve(distRoot, relative);
  if (filename !== distRoot && !filename.startsWith(`${distRoot}${path.sep}`)) {
    response.writeHead(403).end();
    return;
  }
  try {
    const target = (await stat(filename)).isDirectory() ? path.join(filename, 'index.html') : filename;
    const body = await readFile(target);
    const type = target.endsWith('.html') ? 'text/html'
      : target.endsWith('.js') ? 'text/javascript'
      : target.endsWith('.css') ? 'text/css'
      : target.endsWith('.svg') ? 'image/svg+xml'
      : 'application/octet-stream';
    response.writeHead(200, { 'content-type': type }).end(body);
  } catch {
    response.writeHead(404).end();
  }
});

await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;

async function fetchOk(pathname) {
  const response = await fetch(new URL(pathname, origin));
  assert.equal(response.status, 200, `${pathname} returned ${response.status}`);
  return response.text();
}

async function checkHtmlAssets(html) {
  const assets = [...html.matchAll(/(?:src|href)="(\/GameWebsite\/[^"#?]+)"/g)]
    .map((match) => match[1]);
  assert.ok(assets.length >= 2, 'Expected nested asset links');
  for (const asset of assets) await fetchOk(asset);
  return assets.length;
}

try {
  const homepage = await fetchOk(pagesBase);
  await checkHtmlAssets(homepage);
  for (const game of gameCatalog) {
    const page = await fetchOk(`${pagesBase}${game.route.slice(1)}/`);
    assert.match(page, /Studio Arcade/);
    await checkHtmlAssets(page);
    const embed = await fetchOk(`${pagesBase}${game.embedPath.slice(1)}`);
    const count = await checkHtmlAssets(embed);
    console.log(`${game.title}: direct page, embed, ${count} assets OK`);
  }
  const scene = await fetchOk(`${pagesBase}games/signal-below/embed/art/operations.svg`);
  assert.match(scene, /<svg/);
  console.log('Homepage and Signal Below scene asset OK');
} finally {
  await new Promise((resolve) => server.close(resolve));
}
