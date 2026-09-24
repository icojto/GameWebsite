import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { access, realpath } from 'node:fs/promises';
import { gameBuilds, gameCatalog } from '../src/games/catalog.mjs';

const portalRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tscBin = path.join(portalRoot, 'node_modules', 'typescript', 'bin', 'tsc');
await access(tscBin);

for (const game of gameCatalog) {
  const build = gameBuilds[game.slug];
  if (!build) throw new Error(`Missing build configuration for ${game.slug}.`);
  const sourceDir = await realpath(path.resolve(portalRoot, build.sourceDir));
  await run(process.execPath, [tscBin, '--noEmit'], sourceDir);
}

function run(command, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, stdio: 'inherit', shell: false });
    child.once('error', reject);
    child.once('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} exited with code ${code}.`));
    });
  });
}
