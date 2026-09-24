import { defineConfig } from 'vite';

// GitHub Pages serves project repositories below /<repository>/.
export default defineConfig({
  base: process.env.GITHUB_PAGES === 'true' ? '/GameWebsite/' : '/',
});
