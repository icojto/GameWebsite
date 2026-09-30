import './styles.css';
import { gameCatalog } from './games/catalog.mjs';

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) throw new Error('Portal root is missing.');

type Theme = 'light' | 'dark';
type CatalogGame = (typeof gameCatalog)[number];
const siteBase = import.meta.env.BASE_URL.replace(/\/$/, '');
const sitePath = (route: string): string => `${siteBase}${route}${/^\/games\/[^/]+$/.test(route) ? '/' : ''}`;

const storedTheme = window.localStorage.getItem('studioArcade.theme');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
setTheme(storedTheme === 'light' || storedTheme === 'dark'
  ? storedTheme
  : prefersDark ? 'dark' : 'light');

renderRoute();

window.addEventListener('popstate', renderRoute);
document.addEventListener('click', (event) => {
  const target = event.target;
  if (!(target instanceof Element)) return;

  const routeLink = target.closest<HTMLAnchorElement>('a[href^="/"]');
  if (!routeLink || routeLink.target || event.defaultPrevented) return;
  if (event instanceof MouseEvent && (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)) return;

  const destination = new URL(routeLink.href, window.location.href);
  if (destination.origin !== window.location.origin) return;
  event.preventDefault();
  window.history.pushState({}, '', destination.pathname + destination.hash);
  window.scrollTo(0, 0);
  renderRoute();
});

function renderRoute(): void {
  const pathname = normalizePath(window.location.pathname);
  const path = pathname === siteBase ? '/' : pathname.startsWith(`${siteBase}/`)
    ? pathname.slice(siteBase.length)
    : pathname;
  const game = gameCatalog.find((candidate) => candidate.route === path);
  if (game) renderGame(game);
  else if (path === '/') renderHome();
  else renderNotFound();
}

function renderHome(): void {
  const featuredGame = gameCatalog.find((game) => game.featured) ?? gameCatalog[0];
  document.body.dataset.view = 'home';
  document.title = 'OdesosGames · Original games, made here';
  app!.innerHTML = `
    <div class="site-shell">
      ${renderHeader('home')}
      <main id="main-content">
        <section class="hero" aria-labelledby="hero-title">
          <div class="hero-copy">
            <p class="eyebrow"><span></span>${featuredGame.eyebrow}</p>
            <h1 id="hero-title">One clear signal.<br /><em>Endless ways to break it.</em></h1>
            <p class="hero-summary">${featuredGame.description} Reverse at the right moment and stay alive as the arena closes in.</p>
            <div class="hero-actions">
            <a class="primary-action" href="${sitePath(featuredGame.route)}">
                <span class="play-disc" aria-hidden="true">▶</span>
                Play ${featuredGame.title}
                <span aria-hidden="true">→</span>
              </a>
              <span class="quick-note">No download · Saves best score locally</span>
            </div>
          </div>

          <a class="orbit-stage" href="${sitePath(featuredGame.route)}" aria-label="Play ${featuredGame.title}">
            <span class="stage-label">Game 001</span>
            ${renderOrbitVisual('orbit-visual')}
            <span class="stage-footer">
              <span><small>Featured game</small><strong>${featuredGame.title}</strong></span>
              <span class="round-arrow" aria-hidden="true">↗</span>
            </span>
          </a>
        </section>

        <section class="collection" id="collection" aria-labelledby="collection-title">
          <div class="section-heading">
            <div><p class="eyebrow"><span></span>The collection</p><h2 id="collection-title">Made to be played</h2></div>
            <p>One game today. A repeatable home for everything that comes next.</p>
          </div>
          <div class="game-grid">
            ${gameCatalog.map(renderGameCard).join('')}
          </div>
        </section>
      </main>
      <footer><span>OdesosGames</span><span>Independent browser games · ${gameCatalog.length} playable games</span></footer>
    </div>
  `;
  bindSharedControls();
}

function renderGame(game: CatalogGame): void {
  document.body.dataset.view = 'game';
  document.body.dataset.flow = String(game.slug !== 'orbit-break');
  document.title = `${game.title} · OdesosGames`;
  app!.innerHTML = `
    <div class="site-shell game-page viewport-${game.viewport}${game.slug === 'orbit-break' ? '' : ' is-flow-game'}"${game.orientationRequired ? ` data-orientation-required="${game.orientationRequired}"` : ''}>
      ${renderHeader('games')}
      <main id="main-content" class="game-main">
        <section class="game-intro" aria-labelledby="game-title">
          <div>
            <a class="back-link" href="${sitePath('/')}" aria-label="Back to the game library"><span aria-hidden="true">←</span> Browse games</a>
            <div class="game-title-line">
              <p class="eyebrow"><span></span>${game.status}</p>
              <h1 id="game-title">${game.title}</h1>
            </div>
          </div>
          <p>${game.summary}</p>
          <ul class="control-list" aria-label="Controls">
            ${game.controls.map((control) => `<li>${control}</li>`).join('')}
          </ul>
        </section>

        <section class="game-frame-shell" aria-label="${game.title} play area">
          <div class="game-toolbar">
            <span class="live-label"><i></i> OdesosGames player</span>
            <span>${game.slug === 'orbit-break' ? 'Reverse to evade' : game.eyebrow}</span>
            <span class="frame-actions">
              <button class="frame-action frame-help" type="button">How to play</button>
              <button class="frame-action frame-settings" type="button">Settings</button>
              <button class="frame-action frame-fullscreen" type="button" aria-pressed="false">Fullscreen</button>
            </span>
          </div>
          <div class="iframe-panel">
            <p class="orientation-message" role="status"><strong>Landscape works best.</strong> Rotate your device to keep the relay controls in view.</p>
            <div class="frame-loading" role="status" aria-live="polite">
              <span class="loading-orbit" aria-hidden="true"><i></i></span>
              <strong>Loading ${game.title}</strong>
              <small>Preparing the arena…</small>
            </div>
            <div class="frame-error" role="alert" hidden>
              <strong>The game did not load.</strong>
              <span>Check that the local game build is present, then try again.</span>
              <button type="button">Try again</button>
            </div>
            <iframe
              class="game-frame"
              title="${game.title} — playable game"
              src="${sitePath(game.embedPath)}"
              allow="autoplay"
              loading="eager"
              tabindex="0"
            ></iframe>
          </div>
          <div class="game-note">
            <span><strong>Controls:</strong> ${game.controls.join(' · ')}</span>
            <span>Progress stays in this browser when supported.</span>
          </div>
          <dialog class="game-dialog" aria-label="${game.title} player information"></dialog>
        </section>
      </main>
    </div>
  `;
  bindSharedControls();
  bindGameFrame(game);
}

function renderNotFound(): void {
  document.body.dataset.view = 'home';
  document.title = 'Page not found · OdesosGames';
  app!.innerHTML = `
    <div class="site-shell not-found-page">
      ${renderHeader('')}
      <main id="main-content" class="not-found">
        <p class="eyebrow"><span></span>Signal lost</p>
        <h1>That route is outside the arena.</h1>
        <a class="primary-action" href="${sitePath('/')}"><span aria-hidden="true">←</span> Back to games</a>
      </main>
    </div>
  `;
  bindSharedControls();
}

function renderHeader(active: 'home' | 'games' | ''): string {
  return `
    <header class="topbar" aria-label="Primary navigation">
      <a class="brand" href="${sitePath('/')}" aria-label="OdesosGames home">
        <span class="brand-mark" aria-hidden="true"><i></i><b></b></span>
        <span><strong>OdesosGames</strong><small>Original games, made here</small></span>
      </a>
      <nav class="nav-links" aria-label="Portal">
        <a class="nav-link${active === 'home' ? ' is-active' : ''}" href="${sitePath('/')}">Home</a>
        <a class="nav-link${active === 'games' ? ' is-active' : ''}" href="${sitePath('/')}#collection">Games</a>
      </nav>
      <button class="theme-toggle" type="button" aria-label="Switch color theme" aria-pressed="false">
        <span class="sun-icon" aria-hidden="true">☀</span>
        <span class="moon-icon" aria-hidden="true">☾</span>
      </button>
    </header>
  `;
}

function renderGameCard(game: CatalogGame): string {
  return `
    <article class="game-card">
      <a class="card-art" href="${sitePath(game.route)}" aria-label="Open ${game.title}">
        ${renderCardVisual(game)}
        <span class="status-pill">${game.status}</span>
        <span class="card-play" aria-hidden="true">▶</span>
      </a>
      <div class="card-body">
        <div>
          <p class="card-kicker">${game.id.replace('-', ' ')}</p>
          <h3><a href="${sitePath(game.route)}">${game.title}</a></h3>
        </div>
        <p>${game.summary}</p>
        <ul class="tag-list" aria-label="Game details">
          ${game.tags.map((tag) => `<li>${tag}</li>`).join('')}
        </ul>
        <a class="text-link" href="${sitePath(game.route)}">Play now <span aria-hidden="true">→</span></a>
      </div>
    </article>
  `;
}

function renderCardVisual(game: CatalogGame): string {
  if (game.artVariant === 'orbit') {
    return '<span class="mini-orbit" aria-hidden="true"><i></i><b></b></span>';
  }
  return `<span class="card-title-art" aria-hidden="true">${game.title}</span>`;
}

function renderOrbitVisual(className: string): string {
  return `
    <span class="${className}" aria-hidden="true">
      <span class="orbit-ring"><i class="orbit-player"></i></span>
      <i class="hazard hazard-one"></i>
      <i class="hazard hazard-two"></i>
      <b class="orbit-core"></b>
    </span>
  `;
}

function bindSharedControls(): void {
  const themeToggle = document.querySelector<HTMLButtonElement>('.theme-toggle');
  const currentTheme = getTheme();
  updateThemeControl(themeToggle, currentTheme);
  themeToggle?.addEventListener('click', () => {
    const nextTheme = getTheme() === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    window.localStorage.setItem('studioArcade.theme', nextTheme);
    updateThemeControl(themeToggle, nextTheme);
  });

  if (window.location.hash === '#collection') {
    requestAnimationFrame(() => document.querySelector('#collection')?.scrollIntoView());
  }
}

function bindGameFrame(game: CatalogGame): void {
  const frame = document.querySelector<HTMLIFrameElement>('.game-frame');
  const loading = document.querySelector<HTMLElement>('.frame-loading');
  const error = document.querySelector<HTMLElement>('.frame-error');
  const fullscreen = document.querySelector<HTMLButtonElement>('.frame-fullscreen');
  const help = document.querySelector<HTMLButtonElement>('.frame-help');
  const settings = document.querySelector<HTMLButtonElement>('.frame-settings');
  const dialog = document.querySelector<HTMLDialogElement>('.game-dialog');
  const shell = document.querySelector<HTMLElement>('.game-frame-shell');
  const retry = error?.querySelector<HTMLButtonElement>('button');
  if (!frame || !loading || !error) return;
  const gameFrame = frame;
  const loadingState = loading;
  const errorState = error;

  let timeout = window.setTimeout(showError, 10_000);
  let contentObserver: ResizeObserver | undefined;
  let measureFrame = 0;
  const flowLayout = window.matchMedia('(max-width: 680px), (max-height: 600px)');
  const portrait = window.matchMedia('(orientation: portrait)');

  function resizeFrame(reset = false): void {
    if (game.slug === 'orbit-break' || !flowLayout.matches) {
      gameFrame.style.height = '';
      return;
    }
    const minimum = game.slug === 'last-relay' && portrait.matches ? 620 : portrait.matches ? 470 : 400;
    // Reset only on viewport changes; resetting during a content resize would loop.
    if (reset || !gameFrame.style.height) gameFrame.style.height = `${minimum}px`;
    window.cancelAnimationFrame(measureFrame);
    measureFrame = window.requestAnimationFrame(() => {
      try {
        const doc = gameFrame.contentDocument;
        if (!doc) return;
        const height = Math.max(minimum, doc.body?.scrollHeight ?? 0, doc.documentElement.scrollHeight);
        gameFrame.style.height = `${Math.ceil(height)}px`;
      } catch { /* A frame outside our origin keeps its minimum height. */ }
    });
  }

  flowLayout.addEventListener('change', () => resizeFrame(true));
  portrait.addEventListener('change', () => resizeFrame(true));
  window.addEventListener('resize', () => resizeFrame(true));

  gameFrame.addEventListener('load', () => {
    window.clearTimeout(timeout);
    loadingState.hidden = true;
    errorState.hidden = true;
    gameFrame.classList.add('is-ready');
    contentObserver?.disconnect();
    resizeFrame(true);
    try {
      const doc = gameFrame.contentDocument;
      if (doc?.body) {
        contentObserver = new ResizeObserver(() => resizeFrame());
        contentObserver.observe(doc.body);
      }
    } catch { /* The minimum height still allows the game to load. */ }
    try { gameFrame.contentWindow?.focus(); } catch { /* The iframe remains pointer-focusable. */ }
  });
  gameFrame.addEventListener('error', showError);
  retry?.addEventListener('click', reloadFrame);
  help?.addEventListener('click', () => openDialog('help'));
  settings?.addEventListener('click', () => openDialog('settings'));
  fullscreen?.addEventListener('click', toggleFullscreen);
  document.addEventListener('fullscreenchange', updateFullscreenControl);

  function showError(): void {
    loadingState.hidden = true;
    errorState.hidden = false;
    gameFrame.classList.remove('is-ready');
  }

  function reloadFrame(): void {
    contentObserver?.disconnect();
    window.clearTimeout(timeout);
    errorState.hidden = true;
    loadingState.hidden = false;
    gameFrame.classList.remove('is-ready');
    gameFrame.src = `${sitePath(game.embedPath)}?reload=${Date.now()}`;
    timeout = window.setTimeout(showError, 10_000);
  }

  function openDialog(kind: 'help' | 'settings'): void {
    if (!dialog) return;
    if (kind === 'help') {
      dialog.innerHTML = `
        <button class="dialog-close" type="button" aria-label="Close">×</button>
        <p class="eyebrow"><span></span>How to play</p>
        <h2>${game.title}</h2>
        <p>${game.description}</p>
        <h3>Controls</h3>
        <ul class="dialog-list">${game.controls.map((control) => `<li>${control}</li>`).join('')}</ul>
        ${game.orientationRequired ? '<p class="dialog-note">This game is designed for landscape play. Rotate your device for the full control layout.</p>' : ''}
      `;
    } else {
      dialog.innerHTML = `
        <button class="dialog-close" type="button" aria-label="Close">×</button>
        <p class="eyebrow"><span></span>Player settings</p>
        <h2>Display & access</h2>
        <p>${game.title} keeps its game-specific preferences in its own runtime. This shared player provides display controls without changing game state.</p>
        <button class="dialog-theme" type="button">Switch portal theme</button>
        <p class="dialog-note">Use Fullscreen for a distraction-free play area. Restart stays inside the game itself.</p>
      `;
    }
    dialog.querySelector<HTMLButtonElement>('.dialog-close')?.addEventListener('click', () => dialog.close());
    dialog.querySelector<HTMLButtonElement>('.dialog-theme')?.addEventListener('click', () => {
      const nextTheme = getTheme() === 'dark' ? 'light' : 'dark';
      setTheme(nextTheme);
      window.localStorage.setItem('studioArcade.theme', nextTheme);
      updateThemeControl(document.querySelector<HTMLButtonElement>('.theme-toggle'), nextTheme);
    });
    dialog.showModal();
  }

  async function toggleFullscreen(): Promise<void> {
    if (!shell) return;
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await shell.requestFullscreen();
    } catch {
      // Browsers can deny fullscreen without a user gesture or permission.
      fullscreen?.setAttribute('aria-label', 'Fullscreen is unavailable in this browser');
    }
  }

  function updateFullscreenControl(): void {
    const active = document.fullscreenElement === shell;
    fullscreen?.setAttribute('aria-pressed', String(active));
    if (fullscreen) fullscreen.textContent = active ? 'Exit fullscreen' : 'Fullscreen';
  }
}

function normalizePath(path: string): string {
  if (path === '/') return path;
  return path.replace(/\/+$/, '');
}

function getTheme(): Theme {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

function setTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
    ?.setAttribute('content', theme === 'dark' ? '#060a12' : '#f4f7fb');
}

function updateThemeControl(control: HTMLButtonElement | null, theme: Theme): void {
  control?.setAttribute('aria-pressed', String(theme === 'dark'));
  control?.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`);
}
