import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { privacyHtml, termsHtml } from '../src/site/legal-content.mjs';
import { websiteVersion } from './build-identity.mjs';
import { publicPages, siteOrigin, socialImagePath } from '../src/site/pages.mjs';

const portalRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distRoot = path.join(portalRoot, 'dist');
const indexFile = path.join(distRoot, 'index.html');
const template = await readFile(indexFile, 'utf8');
if (!template.includes('<!--route-metadata-->')) throw new Error('Missing route metadata slot in index.html');

function escapeAttribute(value) {
  return String(value).replace(/[&"<>']/g, (character) => ({
    '&': '&amp;', '"': '&quot;', '<': '&lt;', '>': '&gt;', "'": '&#39;',
  })[character]);
}

function renderPage(page) {
  const url = `${siteOrigin}${page.path}`;
  const image = `${siteOrigin}${socialImagePath}`;
  const tags = [
    `<link rel="canonical" href="${escapeAttribute(url)}" />`,
    '<meta property="og:type" content="website" />',
    `<meta property="og:title" content="${escapeAttribute(page.title)}" />`,
    `<meta property="og:description" content="${escapeAttribute(page.description)}" />`,
    `<meta property="og:url" content="${escapeAttribute(url)}" />`,
    `<meta property="og:image" content="${escapeAttribute(image)}" />`,
    '<meta property="og:image:width" content="1200" />',
    '<meta property="og:image:height" content="630" />',
    '<meta property="og:image:alt" content="OdesosGames browser games" />',
    '<meta name="twitter:card" content="summary_large_image" />',
    `<meta name="twitter:title" content="${escapeAttribute(page.title)}" />`,
    `<meta name="twitter:description" content="${escapeAttribute(page.description)}" />`,
    `<meta name="twitter:image" content="${escapeAttribute(image)}" />`,
  ];
  if (page.schema) {
    tags.push(`<script type="application/ld+json">${JSON.stringify(page.schema).replace(/</g, '\\u003c')}</script>`);
  }
  const content = page.path === '/privacy/' ? privacyHtml : page.path === '/terms/' ? termsHtml : null;
  const documentTemplate = content ? template.replace('<div id="app"></div>', `<div id="app"><main id="main-content" tabindex="-1" class="simple-page legal-page"><h1>${page.path === '/privacy/' ? 'Privacy Policy' : 'Terms of Use'}</h1>${content}</main><footer class="site-footer"><strong>OdesosGames · Website ${websiteVersion}</strong><nav><a href="/about/">About</a><a href="/contact/">Contact</a><a href="/privacy/">Privacy</a><a href="/terms/">Terms</a></nav></footer></div></div>`) : template;
  return documentTemplate
    .replace(/<meta name="description"[^>]*>/, `<meta name="description" content="${escapeAttribute(page.description)}" />`)
    .replace(/<title>[^<]*<\/title>/, `<title>${escapeAttribute(page.title)}</title>`)
    .replace('<!--route-metadata-->', tags.join('\n    '));
}

for (const page of publicPages) {
  if (!/^\/(?:|about\/|contact\/|privacy\/|terms\/|games\/[a-z0-9-]+\/)$/.test(page.path)) {
    throw new Error(`Unsafe public route: ${page.path}`);
  }
  const directory = path.join(distRoot, page.path.slice(1));
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, 'index.html'), renderPage(page));
}

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${publicPages.map((page) => `  <url><loc>${siteOrigin}${page.path}</loc></url>`).join('\n')}\n</urlset>\n`;
await writeFile(path.join(distRoot, 'sitemap.xml'), sitemap);
await writeFile(path.join(distRoot, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${siteOrigin}/sitemap.xml\n`);

const publicGameLinks = publicPages
  .filter((page) => page.path.startsWith('/games/'))
  .map((page) => `<a href="${escapeAttribute(page.path)}">${escapeAttribute(page.title.replace(' — OdesosGames', ''))}</a>`)
  .join('');
const notFound = template
  .replace(/<meta name="description"[^>]*>/, '<meta name="description" content="The requested OdesosGames page could not be found." />')
  .replace(/<title>[^<]*<\/title>/, '<title>Page not found — OdesosGames</title>')
  .replace('<!--route-metadata-->', '<meta name="robots" content="noindex" />')
  .replace('<div id="app"></div>', `<div id="app"><div class="site-shell not-found-page"><header class="topbar"><a class="brand" href="/" aria-label="OdesosGames home"><span class="brand-mark" aria-hidden="true"><i></i><b></b></span><span><strong>OdesosGames</strong><small>Original games, made here</small></span></a><nav class="nav-links" aria-label="Portal"><a class="nav-link" href="/">Home</a><a class="nav-link" href="/#collection">Games</a><a class="nav-link" href="/about/">About</a><a class="nav-link" href="/contact/">Contact</a></nav></header><main id="main-content" tabindex="-1" class="not-found"><p class="eyebrow"><span></span>Signal lost</p><h1>Page not found</h1><p>That address is outside the current game collection.</p><div class="not-found-actions"><a class="primary-action" href="/">Home</a><a class="text-link" href="/#collection">Browse games →</a></div></main><footer class="site-footer"><div class="footer-brand"><strong>OdesosGames · Website ${websiteVersion}</strong><span>Independent browser games</span></div><nav aria-label="Footer games"><strong>Games</strong>${publicGameLinks}</nav><nav aria-label="Odesos information"><strong>Odesos</strong><a href="/about/">About</a><a href="/contact/">Contact</a><a href="/privacy/">Privacy</a><a href="/terms/">Terms</a><button type="button" data-privacy-settings>Privacy and cookie settings</button></nav></footer></div>`)
;
await writeFile(path.join(distRoot, '404.html'), notFound);
