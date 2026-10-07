/** Below this allocation, pause animation/input and explain how to recover. */
export const MIN_GAME_VIEWPORT = { width: 240, height: 280 } as const;
export function playableViewport(width: number, height: number): boolean {
  return width >= MIN_GAME_VIEWPORT.width && height >= MIN_GAME_VIEWPORT.height;
}
export function mountViewportFallback(parent: HTMLElement) {
  const fallback = document.createElement('div');
  fallback.className = 'game-viewport-fallback'; fallback.hidden = true;
  fallback.setAttribute('role', 'status');
  fallback.textContent = 'More room needed. Rotate your device, enlarge the window or use Fullscreen. Your run is held.';
  parent.append(fallback);
  return (width: number, height: number) => {
    const supported = playableViewport(width, height);
    fallback.hidden = supported;
    return supported;
  };
}
