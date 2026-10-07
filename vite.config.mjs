import { defineConfig } from 'vite';
import { buildMetadata, identityPlugin, websiteVersion } from './scripts/build-identity.mjs';
import { readFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { gameCatalog } from './src/games/catalog.mjs';

// The configured Pages custom domain serves this site from its root.
export default defineConfig(({command}) => ({
  base: '/',
  // Production-like local QA enforces the exact global static Pages policy.
  // This is local proof, not proof of a Cloudflare deployment.
  preview: { headers: Object.fromEntries(readFileSync(new URL('./public/_headers', import.meta.url), 'utf8').split('\n').filter(line => /^  [A-Za-z-]+:/.test(line)).map(line => {const colon = line.indexOf(':');return [line.slice(0,colon).trim(),line.slice(colon+1).trim()]})) },
  define: { __WEBSITE_VERSION__: JSON.stringify(websiteVersion) },
  plugins: [identityPlugin(buildMetadata(command==='serve'?'development':'production')), {
    name: 'portal-game-routes',
    configureServer(server) {
      // Source directories share portal route names. Keep exact page requests
      // in the portal; leave /embed/ and all nested asset requests untouched.
      const routes = new Set(gameCatalog.map((game) => game.route));
      server.middlewares.use(async (request, response, next) => {
        const pathname = request.url?.split('?')[0].replace(/\/$/, '');
        // Public games' DEV graphs must run inside the real host iframe. Builds still
        // use the separately bundled, Null-provider-safe production embed.
        const devGame = ['orbit-break', 'reactor-stack'].find(slug => pathname === `/games/${slug}/embed/index.html`);
        if (devGame) {
          try {
            const html = (await readFile(new URL(`./games/${devGame}/index.html`, import.meta.url), 'utf8'))
              .replace('src="/src/main.ts"', `src="/games/${devGame}/src/main.ts"`);
            response.setHeader('Content-Type', 'text/html');
            response.end(await server.transformIndexHtml(request.url, html));
          } catch (error) { next(error); }
          return;
        }
        if (routes.has(pathname)) request.url = '/index.html';
        next();
      });
    },
  }],
}));
