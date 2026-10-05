import './presentation.css';
import type { AdView } from '../GameAdPlayer.ts';
import type { Presentation } from '../protocol.ts';

/** Only this DEV import graph contains mock visual copy, CSS and the courtesy asset. */
export function createMockAdView(parent: HTMLElement): AdView {
  const root = document.createElement('section');
  root.className = 'reactor-ad-player'; root.hidden = true; root.tabIndex = -1;
  root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true');
  root.setAttribute('aria-label', 'Advertisement presentation');
  parent.append(root);
  let previous: HTMLElement | null = null;
  let closeAction: (() => void) | null = null;
  let lastSecond = -1;
  const open = () => {
    if (root.hidden) previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    root.hidden = false; root.focus({ preventScroll: true });
  };
  const key = (event: KeyboardEvent) => {
    if (root.hidden) return;
    if (event.key === 'Tab') { event.preventDefault(); (root.querySelector('button') ?? root).focus(); }
    if ([' ', 'Enter', 'Escape', 'Tab'].includes(event.key) || (event.ctrlKey && event.shiftKey && event.code === 'KeyD')) {
      event.stopImmediatePropagation();
      if (event.key === 'Escape') event.preventDefault();
    }
  };
  window.addEventListener('keydown', key, true);
  root.addEventListener('click', (event) => {
    event.stopPropagation();
    if ((event.target as Element).closest('[data-ad-close]')) closeAction?.();
  });
  return {
    courtesy(payload) {
      open(); closeAction = null;
      const concise = payload.courtesy.preset === 'concise';
      const title = concise ? 'One moment…' : payload.adType === 'startup' ? 'Thanks for your patience ♡'
        : payload.adType === 'interstitial' ? 'Sorry for the quick pause!' : 'Thanks!';
      const subtitle = payload.adType === 'startup' ? 'Preparing the game…'
        : payload.adType === 'rewarded' ? 'Preparing your reward…' : 'Thanks for your patience ♡';
      root.dataset.animated = String(payload.courtesy.animation);
      root.innerHTML = `<div class="ad-courtesy"><small>ODESOSGAMES</small>${payload.courtesy.mascot ? '<img class="ad-chibi" alt="" src="' + new URL('../../assets/odesos-chibi-mascot.svg', import.meta.url).href + '">' : ''}<h2>${title}</h2><p>${subtitle}</p><span class="ad-loading" aria-label="Loading">• • •</span></div>`;
    },
    showing(payload: Presentation, close) {
      open(); closeAction = payload.adType === 'rewarded' ? close : null; lastSecond = -1;
      root.innerHTML = '<div class="ad-mock"><small>Advertisement</small><h2>MOCK AD</h2><output data-ad-countdown aria-live="off"></output><p>Development only</p>' + (payload.adType === 'rewarded' ? '<button type="button" data-ad-close>Skip — no reward</button>' : '<p>Continues automatically when the countdown ends.</p>') + '</div>';
    },
    countdown(seconds) {
      const output = root.querySelector<HTMLOutputElement>('[data-ad-countdown]');
      if (!output) return;
      output.textContent = seconds.toFixed(1);
      if (Math.ceil(seconds) !== lastSecond) { lastSecond = Math.ceil(seconds); output.setAttribute('aria-label', `${lastSecond} seconds remaining`); }
    },
    clear() {
      const wasVisible = !root.hidden;
      root.hidden = true; root.replaceChildren(); closeAction = null;
      if (wasVisible && previous?.isConnected && !previous.closest('[inert]')) previous.focus({ preventScroll: true });
    },
    destroy() { window.removeEventListener('keydown', key, true); root.remove(); },
  };
}
