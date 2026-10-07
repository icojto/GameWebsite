import { publicGameCatalog } from '../games/catalog.mjs';

export const siteOrigin = 'https://odesosgames.com';
export const socialImagePath = '/social/odesosgames-card.png';

const staticPages = [
  {
    path: '/',
    title: 'OdesosGames — Browser Games',
    description: 'Play original browser games from OdesosGames, including Orbit Break and Reactor Stack.',
    schema: { '@context': 'https://schema.org', '@type': 'WebSite', name: 'OdesosGames', url: `${siteOrigin}/` },
  },
  {
    path: '/about/',
    title: 'About — OdesosGames',
    description: 'Learn about OdesosGames, an independent browser-game project with Orbit Break and Reactor Stack.',
  },
  {
    path: '/contact/',
    title: 'Contact — OdesosGames',
    description: 'Contact OdesosGames at contact@odesosgames.com about its browser games.',
  },
];

const gamePages = publicGameCatalog.map((game) => ({
  path: `${game.route}/`,
  title: `${game.title} — OdesosGames`,
  description: `${game.summary} Play ${game.title} in your browser on OdesosGames.`,
  schema: {
    '@context': 'https://schema.org',
    '@type': 'VideoGame',
    name: game.title,
    description: game.description,
    url: `${siteOrigin}${game.route}/`,
    genre: game.tags[0],
    gamePlatform: 'Web browser',
    inLanguage: 'en',
  },
}));

export const publicPages = [staticPages[0], ...gamePages, ...staticPages.slice(1)];
