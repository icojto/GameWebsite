import mascotUrl from './mascot.svg';
import type { AdConfig, AdRequest, AdResult, FullscreenType } from '../model.ts';

export const COURTESY_COPY: Record<FullscreenType, [string, string]> = {
  startup: ['Thanks for your patience ♡', 'Preparing the game…'],
  interstitial: ['Sorry for the quick pause!', 'Thanks for your patience ♡'],
  rewarded: ['Thanks!', 'Preparing your reward…'],
};

/** Native modal dialogs keep the iframe and the website underneath inert. */
export class DevAdOverlay {
  private dialog: HTMLDialogElement | null = null;
  private dismiss: (() => void) | null = null;
  get busy(): boolean { return this.dialog !== null; }
  private open(label: string): { dialog: HTMLDialogElement; close: () => void } {
    if (this.dialog) throw new Error('another-overlay-active');
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const dialog = document.createElement('dialog');
    dialog.className = 'odesos-ad-overlay';
    dialog.setAttribute('aria-label', label);
    document.body.append(dialog);
    this.dialog = dialog;
    dialog.showModal();
    return { dialog, close: () => {
      dialog.close(); dialog.remove(); this.dialog = null; this.dismiss = null;
      if (previous?.isConnected) previous.focus({ preventScroll: true });
    } };
  }
  courtesy(type: FullscreenType, config: AdConfig['courtesy'], signal: AbortSignal): Promise<void> {
    if (signal.aborted) return Promise.reject(new Error('closed'));
    const { dialog, close } = this.open('Odesos ad courtesy preview');
    dialog.classList.toggle('ad-animation', config.animation);
    if (config.mascot) {
      const image = document.createElement('img'); image.src = mascotUrl; image.width = 180; image.height = 150; image.alt = ''; image.className = 'ad-mascot'; dialog.append(image);
    }
    const heading = document.createElement('h2');
    const text = document.createElement('p');
    const status = document.createElement('p'); status.setAttribute('role', 'status');
    [heading.textContent, text.textContent] = COURTESY_COPY[type];
    if (config.preset === 'concise') text.textContent = 'Preparing ad…';
    status.textContent = 'Loading ad… • • •';
    const cancel = document.createElement('button'); cancel.type = 'button'; cancel.textContent = 'Cancel preview / ad';
    dialog.append(heading, text, status, cancel); cancel.focus();
    return new Promise((resolve, reject) => {
      let done = false;
      const finish = (cancelled: boolean) => {
        if (done) return; done = true; clearTimeout(timer); signal.removeEventListener('abort', abort); close();
        if (cancelled) reject(new Error('closed')); else resolve();
      };
      const abort = () => finish(true);
      const timer = setTimeout(() => finish(false), config.durationMs);
      this.dismiss = abort;
      signal.addEventListener('abort', abort, { once: true });
      dialog.addEventListener('cancel', (event) => { event.preventDefault(); abort(); });
      cancel.addEventListener('click', abort);
    });
  }
  show(request: AdRequest, durationMs: number, outcome: AdResult, signal: AbortSignal, shown: () => void): Promise<AdResult> {
    if (signal.aborted) return Promise.resolve('closed');
    const { dialog, close } = this.open('MOCK AD — development simulation');
    const title = document.createElement('h2'); title.textContent = 'MOCK AD';
    const info = document.createElement('p'); info.textContent = 'Advertisement simulation · No advertiser · No network request';
    const state = document.createElement('p'); state.textContent = `${request.adType} · ${request.placementId} · target: ${outcome}`;
    const countdown = document.createElement('output'); countdown.className = 'ad-countdown'; countdown.setAttribute('aria-label', 'Seconds remaining');
    const button = document.createElement('button'); button.type = 'button'; button.textContent = 'Close early — no reward';
    dialog.append(title, info, state, countdown, button); button.focus();
    return new Promise((resolve) => {
      let done = false;
      const deadline = performance.now() + (outcome === 'closed' ? durationMs / 2 : durationMs);
      const finish = (result: AdResult) => {
        if (done) return; done = true; clearInterval(timer); signal.removeEventListener('abort', abort); close(); resolve(result);
      };
      const abort = () => finish('closed');
      const update = () => { const remaining = Math.max(0, deadline - performance.now()); countdown.textContent = `00:${String(Math.ceil(remaining / 1000)).padStart(2, '0')}`; if (!remaining) finish(outcome); };
      const timer = setInterval(update, 100); update();
      this.dismiss = abort;
      signal.addEventListener('abort', abort, { once: true });
      dialog.addEventListener('cancel', (event) => { event.preventDefault(); abort(); });
      button.addEventListener('click', abort);
      shown();
    });
  }
  destroy(): void { this.dismiss?.(); }
}

export function delay(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) { reject(new Error('closed')); return; }
    const abort = () => { clearTimeout(timer); reject(new Error('closed')); };
    const timer = setTimeout(() => { signal.removeEventListener('abort', abort); resolve(); }, ms);
    signal.addEventListener('abort', abort, { once: true });
  });
}
