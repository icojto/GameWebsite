import { defineConfig } from 'vite';
import { gameCatalog } from './src/games/catalog.mjs';

// The configured Pages custom domain serves this site from its root.
export default defineConfig({
  base: '/',
  plugins: [{
    name: 'portal-game-routes',
    configureServer(server) {
      // Source directories share portal route names. Keep exact page requests
      // in the portal; leave /embed/ and all nested asset requests untouched.
      const routes = new Set(gameCatalog.map((game) => game.route));
      server.middlewares.use((request, _response, next) => {
        const pathname = request.url?.split('?')[0].replace(/\/$/, '');
        if (routes.has(pathname)) request.url = '/index.html';
        next();
      });
    },
  }],
});
