import { copyFile, mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gameCatalog } from '../src/games/catalog.mjs';

const portalRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distRoot = path.join(portalRoot, 'dist');
const indexFile = path.join(distRoot, 'index.html');
await readFile(indexFile);

// Pages has no SPA fallback. Give every direct game URL a real HTML entry.
for (const game of gameCatalog) {
  const route = game.route.replace(/^\/+|\/+$/g, '');
  if (!/^games\/[a-z0-9-]+$/.test(route)) {
    throw new Error(`Unsafe game route: ${game.route}`);
  }
  const directory = path.join(distRoot, route);
  await mkdir(directory, { recursive: true });
  await copyFile(indexFile, path.join(directory, 'index.html'));
}
