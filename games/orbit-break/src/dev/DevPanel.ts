export type DevCategory = 'Run' | 'Difficulty' | 'Projectiles' | 'Telegraph' | 'Formations'
  | 'Profile' | 'Quests' | 'XP / Economy' | 'Cosmetics' | 'Visual' | 'Audio' | 'QA';

export interface DevControl {
  category: DevCategory;
  path: string;
  label: string;
  type: 'number' | 'boolean' | 'status' | 'action';
  get: () => number | boolean | string;
  set?: (value: number | boolean) => void;
  action?: () => void;
  baseline?: number | boolean;
  min?: number;
  max?: number;
  step?: number;
}

export interface DevContext {
  runTime: number; difficulty: number; score: number; formation: string;
  viewport: string; fps: number;
}

interface Change { system: string; parameter: string; baseValue: number | boolean; testValue: number | boolean }
interface Snapshot { name: string; notes: string; timestamp: string; changes: Change[]; context: DevContext }

export class DevPanel {
  private root = document.createElement('aside');
  private changes = new Map<string, Change>();
  private snapshots: Snapshot[] = [];
  private selected = 'Run';
  private visible = false;
  private refreshTimer: number;

  constructor(parent: HTMLElement, private readonly controls: DevControl[], private readonly context: () => DevContext) {
    this.root.className = 'odesos-dev-panel';
    this.root.setAttribute('aria-label', 'Odesos development panel');
    parent.append(this.root);
    window.addEventListener('keydown', this.onKeyDown, true);
    this.root.addEventListener('click', this.onClick);
    this.root.addEventListener('change', this.onChange);
    this.root.addEventListener('input', this.onChange);
    this.render();
    this.refreshTimer = window.setInterval(() => this.refreshStatuses(), 400);
  }

  destroy(): void {
    window.clearInterval(this.refreshTimer);
    window.removeEventListener('keydown', this.onKeyDown, true);
    this.root.removeEventListener('click', this.onClick);
    this.root.removeEventListener('change', this.onChange);
    this.root.removeEventListener('input', this.onChange);
    this.root.remove();
  }

  toggle(): void { this.visible = !this.visible; this.render(); }

  private render(): void {
    const categories = [...new Set(this.controls.map((control) => control.category)), 'Session Log'];
    this.root.classList.toggle('open', this.visible);
    this.root.innerHTML = `<button class="dev-trigger" type="button" data-dev="toggle" aria-label="Toggle Odesos Dev Panel">DEV</button>
      <div class="dev-drawer" ${this.visible ? '' : 'hidden'}>
        <header><strong>ODESOS <span>DEV / v1</span></strong><button type="button" data-dev="toggle" aria-label="Close Dev Panel">×</button></header>
        <nav aria-label="Development categories">${categories.map((category) => `<button type="button" data-dev="category" data-category="${escapeText(category)}" aria-current="${this.selected === category ? 'page' : 'false'}">${escapeText(category)}</button>`).join('')}</nav>
        <div class="dev-body">${this.selected === 'Session Log' ? this.renderLogger() : this.renderControls()}</div>
      </div>`;
  }

  private renderControls(): string {
    return this.controls.filter((control) => control.category === this.selected).map((control) => {
      const value = control.get();
      const label = escapeText(control.label);
      const path = escapeText(control.path);
      if (control.type === 'status') return `<div class="dev-row dev-status"><span>${label}</span><output data-status="${path}">${escapeText(String(value))}</output></div>`;
      if (control.type === 'action') return `<button class="dev-action" type="button" data-dev="action" data-path="${path}">${label}</button>`;
      if (control.type === 'boolean') return `<label class="dev-row"><span>${label}</span><input type="checkbox" data-control="${path}" ${value ? 'checked' : ''}></label>`;
      return `<label class="dev-row"><span>${label}</span><input type="number" data-control="${path}" value="${value}" min="${control.min ?? -999999}" max="${control.max ?? 999999}" step="${control.step ?? 1}"></label>`;
    }).join('');
  }

  private renderLogger(): string {
    return `<div class="dev-log"><p>Session memory only. Reload clears tests and tuning.</p>
      <label>TEST NAME <input type="text" data-test-name maxlength="80" placeholder="Required name"></label>
      <label>NOTES <textarea data-test-notes maxlength="500" rows="2" placeholder="Optional"></textarea></label>
      <button type="button" data-dev="save-test">SAVE TEST</button>
      <p>${this.changes.size} changed parameter(s) · ${this.snapshots.length} saved test(s)</p>
      <div class="dev-log-actions"><button type="button" data-dev="export-current-csv">EXPORT CURRENT CSV</button><button type="button" data-dev="export-current-json">EXPORT CURRENT JSON</button><button type="button" data-dev="export-all-csv">EXPORT ALL CSV</button><button type="button" data-dev="export-all-json">EXPORT ALL JSON</button><button type="button" data-dev="clear-session">CLEAR SESSION</button></div>
      <div class="dev-changes">${[...this.changes.values()].map((change) => `<div><strong>${escapeText(change.parameter)}</strong><span>${change.baseValue} → ${change.testValue}</span></div>`).join('') || '<small>No changed values.</small>'}</div>
      <ol>${this.snapshots.map((snapshot) => `<li>${escapeText(snapshot.name)} · ${snapshot.changes.length} changes</li>`).join('')}</ol></div>`;
  }

  private refreshStatuses(): void {
    if (!this.visible) return;
    for (const control of this.controls) {
      if (control.category !== this.selected || control.type !== 'status') continue;
      const output = [...this.root.querySelectorAll<HTMLOutputElement>('[data-status]')]
        .find((candidate) => candidate.dataset.status === control.path);
      if (output) output.textContent = String(control.get());
    }
  }

  private onKeyDown = (event: KeyboardEvent): void => {
    if (event.ctrlKey && event.shiftKey && event.code === 'KeyD') {
      event.preventDefault(); event.stopImmediatePropagation(); this.toggle();
    } else if (event.key === 'Escape' && this.visible) {
      event.preventDefault(); event.stopImmediatePropagation(); this.visible = false; this.render();
    }
  };

  private onClick = (event: MouseEvent): void => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const button = target.closest<HTMLButtonElement>('button[data-dev]');
    if (!button) return;
    event.stopPropagation();
    const action = button.dataset.dev;
    if (action === 'toggle') this.toggle();
    else if (action === 'category') { this.selected = button.dataset.category ?? 'Run'; this.render(); }
    else if (action === 'action') this.controls.find((control) => control.path === button.dataset.path)?.action?.();
    else if (action === 'save-test') this.saveTest();
    else if (action?.startsWith('export-')) this.export(action);
    else if (action === 'clear-session') {
      for (const control of this.controls) if (control.baseline !== undefined) control.set?.(control.baseline);
      this.snapshots = []; this.changes.clear(); this.render();
    }
  };

  private onChange = (event: Event): void => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement) || !target.dataset.control) return;
    const control = this.controls.find((item) => item.path === target.dataset.control);
    if (!control?.set) return;
    const value = control.type === 'boolean' ? target.checked : Number(target.value);
    if (typeof value === 'number' && !Number.isFinite(value)) return;
    control.set(value);
    if (control.baseline !== undefined) {
      const actual = control.get();
      if (actual === control.baseline) this.changes.delete(control.path);
      else if (typeof actual === 'number' || typeof actual === 'boolean') {
        this.changes.set(control.path, { system: control.category, parameter: control.path,
          baseValue: control.baseline, testValue: actual });
      }
    }
    target.value = String(control.get());
  };

  private saveTest(): void {
    const name = this.root.querySelector<HTMLInputElement>('[data-test-name]')?.value.trim() ?? '';
    if (!name) { this.root.querySelector<HTMLInputElement>('[data-test-name]')?.focus(); return; }
    const notes = this.root.querySelector<HTMLTextAreaElement>('[data-test-notes]')?.value.trim() ?? '';
    this.snapshots.push({ name, notes, timestamp: new Date().toISOString(),
      changes: [...this.changes.values()].map((change) => ({ ...change })), context: this.context() });
    this.render();
  }

  private export(action: string): void {
    const all = action.includes('all');
    const csv = action.endsWith('csv');
    const snapshots = all ? this.snapshots : [{ name: 'current', notes: '',
      timestamp: new Date().toISOString(), changes: [...this.changes.values()], context: this.context() }];
    const contents = csv ? toCsv(snapshots) : JSON.stringify({ version: 1, tests: snapshots }, null, 2);
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const safeName = (all ? 'all-tests' : snapshots[0]?.name ?? 'current').toLowerCase().replace(/[^a-z0-9-]+/g, '-').slice(0, 40);
    const blob = new Blob([contents], { type: csv ? 'text/csv;charset=utf-8' : 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = `orbit-${safeName}-${stamp}.${csv ? 'csv' : 'json'}`;
    link.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

function toCsv(snapshots: Snapshot[]): string {
  const header = 'test_name,timestamp,system,parameter,base_value,test_value,run_time,difficulty,score,formation,viewport,fps,notes';
  const rows = snapshots.flatMap((snapshot) => snapshot.changes.map((change) => [
    snapshot.name, snapshot.timestamp, change.system, change.parameter, change.baseValue,
    change.testValue, snapshot.context.runTime, snapshot.context.difficulty, snapshot.context.score,
    snapshot.context.formation, snapshot.context.viewport, snapshot.context.fps, snapshot.notes,
  ].map(csvCell).join(',')));
  return [header, ...rows].join('\r\n');
}

function csvCell(value: string | number | boolean): string {
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function escapeText(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char] ?? char);
}
