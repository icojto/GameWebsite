import { AdService } from './service.ts';
import { NullAdAdapter } from './null-adapter.ts';
import { createAdBridge } from './bridge.ts';
import { GamePresentationBroker } from './presentation.ts';
import type { DevTools } from './dev/panel.ts';

export function createAdRuntime(): { attach: (gameId: string | null, frame: HTMLIFrameElement | null, banner: HTMLElement | null) => void } {
  let service = new AdService(new NullAdAdapter());
  const presentation = new GamePresentationBroker();
  let tools: DevTools | null = null;
  let current: { gameId: string | null; frame: HTMLIFrameElement | null; banner: HTMLElement | null } = { gameId: null, frame: null, banner: null };
  let detach = () => {};
  const bind = () => {
    detach(); service.setContext(current.gameId); service.setVisible(!document.hidden); service.attachBanner(current.banner);
    tools?.attachFrame(current.frame);
    const { frame, gameId } = current;
    if (!frame || !gameId) { detach = () => {}; return; }
    const send = (message: Record<string, unknown>) => frame.contentWindow?.postMessage({ protocol: 'odesos-ads', version: 1, ...message }, location.origin);
    presentation.bind(gameId, send);
    let bridge = createAdBridge(service, { origin: location.origin, source: frame.contentWindow, gameId, send, presentation });
    const receive = (event: MessageEvent) => bridge.receive(event);
    const reload = () => {
      bridge.dispose(); service.cancelActive('frame-reloaded'); service.setGameState('unknown');
      presentation.bind(gameId, send);
      bridge = createAdBridge(service, { origin: location.origin, source: frame.contentWindow, gameId, send, presentation });
      tools?.attachFrame(frame);
    };
    window.addEventListener('message', receive); frame.addEventListener('load', reload);
    detach = () => { bridge.dispose(); window.removeEventListener('message', receive); frame.removeEventListener('load', reload); };
  };
  // Vite removes this entire import and its CSS/SVG dependency graph in production.
  if (import.meta.env.DEV) {
    void import('./dev/panel.ts').then(async ({ createDevTools }) => {
      tools = await createDevTools(presentation); detach(); service.destroy(); service = tools.service; bind();
    }).catch(() => { /* Keep NullAdAdapter if development tooling fails to initialize. */ });
  }
  document.addEventListener('visibilitychange', () => service.setVisible(!document.hidden));
  window.setInterval(() => service.tick(), 500);
  window.addEventListener('pagehide', (event) => {
    service.cancelActive('page-hidden');
    if (!event.persisted) { detach(); service.destroy(); tools?.destroy(); }
  });
  window.addEventListener('pageshow', (event) => { if (event.persisted) bind(); });
  return { attach(gameId, frame, banner) { current = { gameId, frame, banner }; bind(); } };
}
