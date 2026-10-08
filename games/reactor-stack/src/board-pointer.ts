/** One captured Pointer Events path for mouse, pen and touch. */
export interface BoardPointerHooks {
  enabled(): boolean;
  begin(x: number, y: number, id: number): void;
  move?(x: number, y: number, id: number): void;
  release(x: number, y: number, id: number): void;
  cancel(): void;
}
export function bindBoardPointer(canvas: HTMLElement, hooks: BoardPointerHooks) {
  let owner: number | null = null;
  function finishCapture(id: number) {
    try { if (canvas.hasPointerCapture?.(id)) canvas.releasePointerCapture(id); } catch { /* Detached canvas / already lost capture. */ }
  }
  function cancel() {
    const id = owner; owner = null;
    if (id !== null) finishCapture(id);
    hooks.cancel();
  }
  function down(event: PointerEvent) {
    if (owner !== null || (event.pointerType !== 'touch' && event.button !== 0) || !hooks.enabled()) return;
    owner = event.pointerId;
    event.preventDefault();
    hooks.begin(event.clientX, event.clientY, owner);
    // Android may report unsupported/late capture. Window listeners still own
    // this pointer until release/cancel; a capture exception cannot swallow it.
    try { canvas.setPointerCapture?.(owner); } catch { /* Window release fallback. */ }
  }
  function move(event: PointerEvent) {
    if (event.pointerId !== owner) return;
    event.preventDefault();
    if (!hooks.enabled()) cancel();
    else hooks.move?.(event.clientX, event.clientY, owner);
  }
  function up(event: PointerEvent) {
    if (event.pointerId !== owner) return;
    const id = owner; owner = null;
    event.preventDefault();
    if (hooks.enabled()) hooks.release(event.clientX, event.clientY, id);
    else hooks.cancel();
    finishCapture(id);
  }
  function lost(event: PointerEvent) { if (event.pointerId === owner) cancel(); }
  canvas.addEventListener('pointerdown', down, { passive: false });
  const surface = canvas.ownerDocument.defaultView ?? canvas;
  surface.addEventListener('pointermove', move as EventListener, { passive: false });
  surface.addEventListener('pointerup', up as EventListener, { passive: false });
  surface.addEventListener('pointercancel', lost as EventListener);
  canvas.addEventListener('lostpointercapture', lost);
  canvas.ownerDocument.defaultView?.addEventListener('blur', cancel);
  return { cancel, destroy() {
    cancel();
    canvas.removeEventListener('pointerdown', down);
    surface.removeEventListener('pointermove', move as EventListener);
    surface.removeEventListener('pointerup', up as EventListener);
    surface.removeEventListener('pointercancel', lost as EventListener);
    canvas.removeEventListener('lostpointercapture', lost);
    canvas.ownerDocument.defaultView?.removeEventListener('blur', cancel);
  } };
}
export function canvasPoint(clientX: number, clientY: number, rect: { left: number; top: number; width: number; height: number }, width: number, height: number) {
  return { x: (clientX - rect.left) * width / rect.width, y: (clientY - rect.top) * height / rect.height };
}
