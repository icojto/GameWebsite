import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { websiteVersion } from './build-identity.mjs';
import { gameCatalog, publicGameCatalog } from '../src/games/catalog.mjs';
import { publicPages, siteOrigin, socialImagePath } from '../src/site/pages.mjs';

const portalRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distRoot = path.join(portalRoot, 'dist');
const server = createServer(async (request, response) => {
  const pathname = new URL(request.url ?? '/', 'http://localhost').pathname;
  const relative = pathname.slice(1);
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
      : target.endsWith('.png') ? 'image/png'
      : 'application/octet-stream';
    response.writeHead(200, { 'content-type': type }).end(body);
  } catch {
    response.writeHead(404, { 'content-type': 'text/html' }).end(await readFile(path.join(distRoot, '404.html')));
  }
});

await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;

async function fetchOk(pathname) {
  const response = await fetch(new URL(pathname, origin));
  assert.equal(response.status, 200, `${pathname} returned ${response.status}`);
  return response.text();
}

async function fetchStatus(pathname) {
  return fetch(new URL(pathname, origin));
}

async function checkHtmlAssets(html) {
  assert.doesNotMatch(html, /\/GameWebsite\//, 'Found stale project-path asset URL');
  const assets = [...html.matchAll(/(?:src|href)="(\/[^"#?]+)"/g)]
    .map((match) => match[1]);
  assert.ok(assets.length >= 2, 'Expected nested asset links');
  for (const asset of assets) await fetchOk(asset);
  return assets.length;
}

try {
  const config = JSON.parse(await readFile(path.join(portalRoot, 'wrangler.jsonc'), 'utf8'));
  assert.equal(config.assets.directory, './dist');
  assert.equal(config.assets.not_found_handling, '404-page');
  assert.equal(config.assets.html_handling, 'auto-trailing-slash');
  assert.deepEqual(config.previews, {}, 'Static-only branch Previews require an explicit empty previews block');
  assert.equal(config.main, undefined, 'Static hosting must not introduce a Worker script');
  const headers = await readFile(path.join(distRoot, '_headers'), 'utf8');
  assert.equal(headers, await readFile(path.join(portalRoot, 'public', '_headers'), 'utf8'));
  assert.match(headers, /X-Content-Type-Options: nosniff/);
  const homepage = await fetchOk('/');
  await checkHtmlAssets(homepage);
  assert.deepEqual(publicGameCatalog.map((game) => game.slug), ['orbit-break', 'reactor-stack']);
  assert.equal(publicGameCatalog.length, 2);
  assert.deepEqual(publicPages.map((page) => page.path), [
    '/', '/games/orbit-break/', '/games/reactor-stack/', '/about/', '/contact/', '/privacy/', '/terms/',
  ]);
  const titles = new Set();
  for (const page of publicPages) {
    const html = await fetchOk(page.path);
    const canonical = `${siteOrigin}${page.path}`;
    assert.match(html, /<meta name="description" content="[^"]+"/);
    assert.ok(html.includes(`<title>${page.title}</title>`), `Title missing for ${page.path}`);
    assert.ok(!titles.has(page.title), `Duplicate title: ${page.title}`);
    titles.add(page.title);
    assert.ok(html.includes(`<link rel="canonical" href="${canonical}"`), `Canonical missing for ${page.path}`);
    for (const [property, value] of [
      ['og:title', page.title], ['og:description', page.description], ['og:url', canonical],
      ['og:image', `${siteOrigin}${socialImagePath}`],
    ]) {
      assert.ok(html.includes(`<meta property="${property}" content="${value}"`), `${property} missing for ${page.path}`);
    }
    assert.match(html, /<meta name="twitter:card" content="summary_large_image"/);
    assert.match(html, /<meta name="twitter:image" content="https:\/\/odesosgames.com\/social\/odesosgames-card.png"/);
    assert.equal([...html.matchAll(/<script type="application\/ld\+json">([^<]+)<\/script>/g)].length, page.schema ? 1 : 0);
    for (const match of html.matchAll(/<script type="application\/ld\+json">([^<]+)<\/script>/g)) {
      assert.deepEqual(JSON.parse(match[1]), page.schema);
    }
    await checkHtmlAssets(html);
  }
  const imageResponse = await fetchStatus(socialImagePath);
  assert.equal(imageResponse.status, 200);
  assert.equal(imageResponse.headers.get('content-type'), 'image/png');
  const png = Buffer.from(await imageResponse.arrayBuffer());
  assert.equal(png.readUInt32BE(16), 1200);
  assert.equal(png.readUInt32BE(20), 630);

  const sitemap = await fetchOk('/sitemap.xml');
  const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  assert.deepEqual(urls, publicPages.map((page) => `${siteOrigin}${page.path}`));
  const robots = await fetchOk('/robots.txt');
  assert.match(robots, /User-agent: \*/);
  assert.match(robots, /Sitemap: https:\/\/odesosgames.com\/sitemap.xml/);

  const notFound = await fetchOk('/404.html');
  assert.match(notFound, /<h1>Page not found<\/h1>/);
  assert.ok(notFound.includes('Website '+websiteVersion));
  const unknown = await fetchStatus('/unknown-release-check/child');
  assert.equal(unknown.status, 404);
  assert.match(await unknown.text(), /<h1>Page not found<\/h1>/);
  assert.match(notFound, /<meta name="robots" content="noindex"/);
  assert.match(notFound, /<main id="main-content"/);
  assert.match(notFound, /<div id="app">/, 'Static 404 must mount the portal so footer privacy controls initialize');
  assert.match(notFound, /href="\/about\/"/);
  assert.match(notFound, /<script type="module"/);

  const portalSource = await readFile(path.join(portalRoot, 'src', 'main.ts'), 'utf8');
  const portalCss = await readFile(path.join(portalRoot, 'src', 'styles.css'), 'utf8');
  assert.match(portalSource, /<main id="main-content" tabindex="-1"/);
  assert.match(portalSource, /aria-current="page"/);
  assert.match(portalSource, /aria-label="Portal"/);
  assert.match(portalSource, /aria-labelledby="controls-title"/);
  assert.match(portalSource, /title="\$\{escapeHtml\(game\.title\)\} — playable game"/);
  assert.match(portalSource, /controlsPopup\.addEventListener\('close', restoreControlsFocus\)/);
  assert.match(portalCss, /@media \(max-width: 900px\)/);
  assert.match(portalCss, /\.nav-links/);
  assert.match(homepage, /Skip to main content/);
  assert.match(homepage, /href="#main-content"/);
  for (const game of publicGameCatalog) {
    await fetchOk(game.route);
    const page = await fetchOk(`${game.route}/`);
    assert.match(page, /OdesosGames/);
    await checkHtmlAssets(page);
    const embed = await fetchOk(game.embedPath);
    const count = await checkHtmlAssets(embed);
    console.log(`${game.title}: direct page, embed, ${count} assets OK`);
  }
  for (const game of gameCatalog.filter((candidate) => candidate.visibility === 'hidden')) {
    assert.equal((await fetchStatus(game.route)).status, 404, `${game.route} remained public`);
    assert.equal((await fetchStatus(`${game.route}/`)).status, 404, `${game.route}/ remained public`);
    const embed = await fetchOk(game.embedPath);
    const count = await checkHtmlAssets(embed);
    console.log(`${game.title}: on-hold source build, ${count} embed assets OK`);
    for (const page of publicPages) {
      const publicHtml = await fetchOk(page.path);
      assert.ok(!publicHtml.includes(game.title), `${game.title} appeared in ${page.path}`);
      assert.ok(!publicHtml.includes(game.slug), `${game.slug} appeared in ${page.path}`);
    }
    assert.ok(!sitemap.includes(game.slug), `${game.slug} appeared in sitemap`);
  }
  for (const name of ['operations', 'yard', 'archive', 'sublevel']) {
    const scene = await fetchOk(`/games/signal-below/embed/art/${name}.svg`);
    assert.match(scene, /<svg/);
  }
  console.log('Public metadata, sitemap, robots, social image, 404, structural smoke, and four Signal Below scene assets OK');
} finally {
  await new Promise((resolve) => server.close(resolve));
}
