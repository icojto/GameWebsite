import { access, mkdir, realpath, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { gameBuilds, gameCatalog } from '../src/games/catalog.mjs';

const portalRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const gamesOutputRoot = path.join(portalRoot, 'public', 'games');
const viteBin = path.join(portalRoot, 'node_modules', 'vite', 'bin', 'vite.js');
const siteBase = process.env.GITHUB_PAGES === 'true' ? '/GameWebsite' : '';

await mkdir(gamesOutputRoot, { recursive: true });
await access(viteBin);

for (const game of gameCatalog) {
  const build = gameBuilds[game.slug];
  if (!build) throw new Error(`Missing build configuration for ${game.slug}.`);

  const sourceDir = await realpath(path.resolve(portalRoot, build.sourceDir));
  await access(path.join(sourceDir, 'index.html'));

  const embedSegment = game.embedBase.replace(/^\/+|\/+$/g, '');
  const outputDir = path.resolve(portalRoot, 'public', embedSegment);
  const safeRelative = path.relative(gamesOutputRoot, outputDir);
  if (!safeRelative || safeRelative.startsWith('..') || path.isAbsolute(safeRelative)) {
    throw new Error(`Refusing to write game build outside ${gamesOutputRoot}.`);
  }

  await rm(outputDir, { recursive: true, force: true });
  await run(process.execPath, [
    viteBin,
    'build',
    '--base',
    `${siteBase}${game.embedBase}`,
    '--outDir',
    outputDir,
    '--emptyOutDir',
  ], sourceDir);
}

function run(command, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, stdio: 'inherit' });
    child.once('error', reject);
    child.once('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${path.basename(command)} exited with code ${code}.`));
    });
  });
}
