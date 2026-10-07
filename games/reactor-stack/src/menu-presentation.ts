export const INITIAL_MENU = {
  kicker: 'CONTAINMENT PROTOCOL / 002', title: 'REACTOR STACK',
  copy: 'Move cells into adjacent empty slots or merge equal reactor cells. Build stability before heat reaches critical.',
  start: 'INITIALIZE REACTOR', failed: false,
};
/** Invalidates delayed terminal UI independently of completed score history. */
export class MenuPresentation {
  private epoch = 0;
  invalidate() { this.epoch++; }
  reset(render: (view: typeof INITIAL_MENU) => void) { this.invalidate(); render({ ...INITIAL_MENU }); }
  guard(isCurrent: () => boolean, render: () => void) {
    const epoch = this.epoch;
    return () => { if (epoch === this.epoch && isCurrent()) render(); };
  }
}
