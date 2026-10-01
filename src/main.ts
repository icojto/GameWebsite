import './styles.css';
import { publicGameCatalog } from './games/catalog.mjs';

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) throw new Error('Portal root is missing.');
let disposeGameFrame = () => {};

type Theme = 'light' | 'dark';
type CatalogGame = (typeof publicGameCatalog)[number];
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
  disposeGameFrame();
  disposeGameFrame = () => {};

  const pathname = normalizePath(window.location.pathname);
  const path = pathname === siteBase ? '/' : pathname.startsWith(`${siteBase}/`)
    ? pathname.slice(siteBase.length)
    : pathname;
  const game = publicGameCatalog.find((candidate) => candidate.route === path);
  if (game) renderGame(game);
  else if (path === '/') renderHome();
  else renderNotFound();
}

function renderHome(): void {
  const featuredGame = publicGameCatalog.find((game) => game.featured) ?? publicGameCatalog[0];
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
            ${publicGameCatalog.map(renderGameCard).join('')}
          </div>
        </section>
      </main>
      <footer><span>OdesosGames</span><span>Independent browser games · ${publicGameCatalog.length} playable games</span></footer>
    </div>
  `;
  bindSharedControls();
}

function renderGame(game: CatalogGame): void {
  document.body.dataset.view = 'game';
  document.title = `${game.title} · OdesosGames`;
  app!.innerHTML = `
    <div class="site-shell game-page player-${game.player.layout}" style="--game-accent: ${game.accent}; --game-accent-alt: ${game.accentAlt};">
      ${renderHeader('games')}
      <main id="main-content" class="game-main">
        <section class="player-shell" aria-label="${game.title} player">
          <section class="game-stage" aria-label="${game.title} play area">
            <div class="game-content-frame">
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
          </section>
          <section class="player-action-bar" aria-label="${game.title} player actions">
            <div class="player-title"><span class="game-mark" aria-hidden="true">${game.id.replace('game-', '')}</span><strong>${game.title}</strong></div>
            <div class="player-actions">
              <button class="player-action" type="button" data-reaction="like" aria-label="Like ${game.title}" aria-pressed="false"><span aria-hidden="true">👍</span><span class="action-label">Like</span></button>
              <button class="player-action" type="button" data-reaction="dislike" aria-label="Dislike ${game.title}" aria-pressed="false"><span aria-hidden="true">👎</span><span class="action-label">Dislike</span></button>
              <button class="player-action" type="button" data-controls aria-haspopup="dialog"><span aria-hidden="true">?</span><span class="action-label">Controls</span></button>
              <button class="player-action" type="button" data-frame-fullscreen aria-label="Open ${game.title} in fullscreen" aria-pressed="false"><span aria-hidden="true">⛶</span><span class="action-label">Fullscreen</span></button>
            </div>
          </section>
        </section>
        <section class="game-information" aria-labelledby="game-title">
          <div>
            <p class="eyebrow"><span></span>${game.eyebrow}</p>
            <h1 id="game-title">${game.title}</h1>
            <p>${game.description}</p>
          </div>
          <dl class="game-facts">
            <div><dt>Type</dt><dd>${game.tags.slice(0, 2).join(' · ')}</dd></div>
            <div><dt>Orientation</dt><dd>${game.player.orientation === 'prefer-portrait' ? 'Prefer portrait' : 'Any orientation'}</dd></div>
            <div><dt>Play</dt><dd>Browser</dd></div>
          </dl>
          <details class="how-to-play"><summary>How to play</summary><ul>${game.controls.map((control) => `<li>${control}</li>`).join('')}</ul></details>
        </section>
        <dialog class="controls-dialog" aria-labelledby="controls-title">
          <div class="controls-dialog-card">
            <button class="dialog-close" type="button" data-controls-close aria-label="Close controls">×</button>
            <p class="eyebrow"><span></span>Controls</p>
            <h2 id="controls-title">${game.title}</h2>
            <ul>${game.controls.map((control) => `<li>${control}</li>`).join('')}</ul>
          </div>
        </dialog>
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
  const fullscreen = document.querySelector<HTMLButtonElement>('[data-frame-fullscreen]');
  const controls = document.querySelector<HTMLButtonElement>('[data-controls]');
  const controlsDialog = document.querySelector<HTMLDialogElement>('.controls-dialog');
  const controlsClose = document.querySelector<HTMLButtonElement>('[data-controls-close]');
  const stage = document.querySelector<HTMLElement>('.player-shell');
  const retry = error?.querySelector<HTMLButtonElement>('button');
  if (!frame || !loading || !error || !fullscreen || !controls || !controlsDialog || !controlsClose || !stage || !retry) return;

  const gameFrame = frame;
  const loadingState = loading;
  const errorState = error;
  const fullscreenControl = fullscreen;
  const playerStage = stage;
  const retryControl = retry;
  const controlsControl = controls;
  const controlsPopup = controlsDialog;
  const controlsCloseControl = controlsClose;
  const reactionButtons = [...document.querySelectorAll<HTMLButtonElement>('[data-reaction]')];
  const reactionKey = `odesos.player.reaction.${game.slug}`;

  let timeout = window.setTimeout(showError, 10_000);

  function handleLoad(): void {
    window.clearTimeout(timeout);
    loadingState.hidden = true;
    errorState.hidden = true;
    gameFrame.classList.add('is-ready');
  }

  function showError(): void {
    loadingState.hidden = true;
    errorState.hidden = false;
    gameFrame.classList.remove('is-ready');
  }

  function reloadFrame(): void {
    window.clearTimeout(timeout);
    errorState.hidden = true;
    loadingState.hidden = false;
    gameFrame.classList.remove('is-ready');
    gameFrame.src = `${sitePath(game.embedPath)}?reload=${Date.now()}`;
    timeout = window.setTimeout(showError, 10_000);
  }

  async function toggleFullscreen(): Promise<void> {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await playerStage.requestFullscreen();
    } catch {
      // Browsers can deny fullscreen without a user gesture or permission.
      fullscreen?.setAttribute('aria-label', 'Fullscreen is unavailable in this browser');
    }
  }

  function updateFullscreenControl(): void {
    const active = document.fullscreenElement === playerStage;
    fullscreenControl.setAttribute('aria-pressed', String(active));
    fullscreenControl.setAttribute('aria-label', active ? `Exit ${game.title} fullscreen` : `Open ${game.title} in fullscreen`);
    const label = fullscreenControl.querySelector<HTMLElement>('.action-label');
    if (label) label.textContent = active ? 'Exit fullscreen' : 'Fullscreen';
  }

  function updateReaction(reaction: string | null): void {
    reactionButtons.forEach((button) => {
      const selected = button.dataset.reaction === reaction;
      button.setAttribute('aria-pressed', String(selected));
      button.classList.toggle('is-selected', selected);
    });
  }

  function chooseReaction(event: Event): void {
    const button = event.currentTarget as HTMLButtonElement;
    const next = button.dataset.reaction ?? null;
    const current = window.localStorage.getItem(reactionKey);
    const reaction = current === next ? null : next;
    if (reaction) window.localStorage.setItem(reactionKey, reaction);
    else window.localStorage.removeItem(reactionKey);
    updateReaction(reaction);
  }

  function openControls(): void {
    controlsPopup.showModal();
  }

  function closeControls(): void {
    controlsPopup.close();
    controlsControl.focus();
  }

  gameFrame.addEventListener('load', handleLoad);
  gameFrame.addEventListener('error', showError);
  retryControl.addEventListener('click', reloadFrame);
  fullscreenControl.addEventListener('click', toggleFullscreen);
  controlsControl.addEventListener('click', openControls);
  controlsCloseControl.addEventListener('click', closeControls);
  reactionButtons.forEach((button) => button.addEventListener('click', chooseReaction));
  document.addEventListener('fullscreenchange', updateFullscreenControl);
  updateReaction(window.localStorage.getItem(reactionKey));

  disposeGameFrame = () => {
    window.clearTimeout(timeout);
    gameFrame.removeEventListener('load', handleLoad);
    gameFrame.removeEventListener('error', showError);
    retryControl.removeEventListener('click', reloadFrame);
    fullscreenControl.removeEventListener('click', toggleFullscreen);
    controlsControl.removeEventListener('click', openControls);
    controlsCloseControl.removeEventListener('click', closeControls);
    reactionButtons.forEach((button) => button.removeEventListener('click', chooseReaction));
    document.removeEventListener('fullscreenchange', updateFullscreenControl);
  };
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
