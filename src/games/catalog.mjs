/**
 * The public catalog drives every game shelf and route in the portal.
 * Add future games here instead of hard-coding homepage sections.
 */
export const gameCatalog = [
  {
    id: 'game-001',
    slug: 'orbit-break',
    title: 'Orbit Break',
    featured: true,
    artVariant: 'orbit',
    eyebrow: 'Now playable',
    summary: 'Reverse your orbit. Read the warning lines. Survive the pattern.',
    description: 'A compact one-action survival game built for quick runs and clean restarts.',
    route: '/games/orbit-break',
    embedBase: '/games/orbit-break/embed/',
    embedPath: '/games/orbit-break/embed/index.html',
    controls: ['Space', 'Click', 'Tap'],
    tags: ['Arcade', 'One action', 'Local best score'],
    accent: '#20e9ff',
    accentAlt: '#ff2caa',
    status: 'Playable',
  },
];

/** Build-only source locations, resolved from the portal root. */
export const gameBuilds = {
  'orbit-break': {
    sourceDir: 'games/orbit-break',
  },
};
