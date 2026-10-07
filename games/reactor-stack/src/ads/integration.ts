import { ReactorAdClient } from './ReactorAdClient.ts';
import { ReactorAdFlow, type Power } from './ReactorAdFlow.ts';
import type { TurnController } from '../rules.ts';
import type { ReactorAudio } from '../audio.ts';
import type { GameAdPlayer } from './GameAdPlayer.ts';
import type { Lifecycle, Presentation } from './protocol.ts';

interface Hooks { start(): void; cancelGesture(): void; feedback(text: string): void; refresh(): void; freeze(value: boolean): void }
/** Only orchestration and game-side suspension; no host policy or provider decisions. */
export function connectReactorAds(controller: TurnController, audio: ReactorAudio, hooks: Hooks) {
  let player: GameAdPlayer | null = null, alive = true;
  let deferred: { payload: Presentation; emit: (event: Lifecycle, reason?: 'player-skip' | 'external-close') => void } | null = null;
  let updateDev = () => {};
  const sync = () => {
    if (!alive) return;
    const phase = controller.phase;
    client.reportState(flow.locked ? 'paused' : phase === 'BOOT' ? 'unknown' : phase === 'MENU' ? 'menu'
      : phase === 'RESULT' ? 'game-over' : phase === 'PAUSED' ? 'paused' : 'playing');
    audio.suspendForAd(flow.locked);
    document.getElementById('pause-overlay')!.hidden = phase !== 'PAUSED';
    for (const id of ['game-shell', 'menu-overlay', 'pause-overlay', 'scores-overlay', 'dev-panel']) {
      const node = document.getElementById(id);
      if (node) node.inert = flow.locked;
    }
    for (const power of ['cool', 'upgrade'] as Power[]) {
      const offer = flow.canRefill(power);
      for (const id of [power, 'portrait-' + power]) {
        const button = document.getElementById(id)! as HTMLButtonElement;
        const label = button.querySelector<HTMLElement>('[data-power-label]')!;
        label.textContent = offer ? (id.startsWith('portrait-') ? 'AD: +1 ' : 'Watch ad: +1 ') + (power === 'cool' ? 'Cool Core' : 'Upgrade')
          : power === 'cool' ? 'COOL CORE' : 'UPGRADE';
        button.classList.toggle('refill-offer', offer);
        button.title = offer ? 'One ad attempt per power-up each run. A completed qualified ad grants +1; skipping gives no reward.' : '';
        button.disabled = flow.locked || phase !== 'PLAYING' || (!offer && controller.state[power === 'cool' ? 'coolCoreRemaining' : 'upgradeRemaining'] === 0);
      }
    }
    updateDev();
  };
  const client = new ReactorAdClient({
    origin: window.location.origin, source: window.parent,
    send: message => { if (window.parent !== window) window.parent.postMessage(message, window.location.origin); },
    changed: sync, presentationReady: () => player !== null,
    suspend: value => { flow.suspended = value; hooks.cancelGesture(); if (controller.phase !== 'RESOLVING') hooks.freeze(value); sync(); },
    present: (payload, emit) => {
      if (!player) return false;
      if (controller.phase === 'RESOLVING') { deferred = { payload, emit }; return true; }
      return player.play(payload, emit);
    },
    cancelPresentation: () => { deferred = null; player?.cancel(); hooks.freeze(false); },
  });
  const flow = new ReactorAdFlow(controller, client, {
    start: hooks.start, cancelGesture: hooks.cancelGesture, feedback: hooks.feedback,
    changed: () => { hooks.refresh(); sync(); },
  });
  const receive = (event: MessageEvent) => client.receive(event);
  window.addEventListener('message', receive);
  client.start();
  let disposeDev = () => {};
  if (import.meta.env.DEV) void import('./dev/integration-dev.ts').then(({ mountAdsDev }) => {
    if (!alive) return;
    const dev = mountAdsDev({ flow, client, controller, refresh: () => { hooks.refresh(); sync(); } });
    player = dev.player; updateDev = dev.update; disposeDev = dev.destroy;
    // Advertise only after a real game-owned view exists.
    client.start(); sync();
  });
  const settled = () => {
    if (deferred && player) { const next = deferred; deferred = null; hooks.freeze(true); player.play(next.payload, next.emit); }
    void flow.settledTurn(); sync();
  };
  const destroy = () => {
    alive = false; flow.destroy(); client.destroy(); player?.destroy(); disposeDev();
    window.removeEventListener('message', receive); audio.suspendForAd(false); hooks.freeze(false);
    for (const id of ['game-shell', 'menu-overlay', 'pause-overlay', 'scores-overlay', 'dev-panel']) {
      const node = document.getElementById(id); if (node) node.inert = false;
    }
  };
  window.addEventListener('pagehide', destroy, { once: true });
  // A restored document must establish a fresh bridge after disposal. Active runs
  // are intentionally not persisted across browser navigation.
  window.addEventListener('pageshow', event => { if (event.persisted) window.location.reload(); });
  return { flow, client, sync, settled, destroy };
}
