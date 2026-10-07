/** One captured Pointer Events path for mouse, pen and touch. */
export interface BoardPointerHooks {
  enabled(): boolean;
  begin(x: number, y: number, id: number): void;
  release(x: number, y: number, id: number): void;
  cancel(): void;
}
export function bindBoardPointer(canvas: HTMLElement, hooks: BoardPointerHooks) {
  let owner: number | null = null;
  function finishCapture(id: number) {
    if (canvas.hasPointerCapture(id)) canvas.releasePointerCapture(id);
  }
  function cancel() {
    const id = owner; owner = null;
    if (id !== null) finishCapture(id);
    hooks.cancel();
  }
  function down(event: PointerEvent) {
    if (owner !== null || event.button !== 0 || !hooks.enabled()) return;
    owner = event.pointerId;
    try { canvas.setPointerCapture(owner); } catch { cancel(); return; }
    event.preventDefault();
    hooks.begin(event.clientX, event.clientY, owner);
  }
  function move(event: PointerEvent) {
    if (event.pointerId !== owner) return;
    event.preventDefault();
    if (!hooks.enabled()) cancel();
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
  canvas.addEventListener('pointermove', move, { passive: false });
  canvas.addEventListener('pointerup', up, { passive: false });
  canvas.addEventListener('pointercancel', lost);
  canvas.addEventListener('lostpointercapture', lost);
  canvas.ownerDocument.defaultView?.addEventListener('blur', cancel);
  return { cancel, destroy() {
    cancel();
    canvas.removeEventListener('pointerdown', down);
    canvas.removeEventListener('pointermove', move);
    canvas.removeEventListener('pointerup', up);
    canvas.removeEventListener('pointercancel', lost);
    canvas.removeEventListener('lostpointercapture', lost);
    canvas.ownerDocument.defaultView?.removeEventListener('blur', cancel);
  } };
}
export function canvasPoint(clientX: number, clientY: number, rect: { left: number; top: number; width: number; height: number }, width: number, height: number) {
  return { x: (clientX - rect.left) * width / rect.width, y: (clientY - rect.top) * height / rect.height };
}
