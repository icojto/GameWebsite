/** One local-document help surface. No access to a parent/child document. */
export class ContextHelp {
  private bubble: HTMLElement;
  private active: HTMLElement | null = null;
  private pinned = false;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private abort = new AbortController();
  private entries = new WeakMap<HTMLElement, { text: string; button: HTMLButtonElement; target: HTMLElement }>();
  constructor(private doc: Document) {
    this.bubble = doc.createElement('div'); this.bubble.className = 'ad-context-help';
    this.bubble.id = `ad-help-${Math.random().toString(36).slice(2)}`;
    this.bubble.setAttribute('role', 'tooltip'); this.bubble.hidden = true;
    doc.body.append(this.bubble);
    const options = { capture: true, signal: this.abort.signal };
    doc.addEventListener('keydown', (event) => { this.dismissEscape(event); }, options);
    doc.addEventListener('pointerdown', (event) => {
      if (this.active && !this.active.contains(event.target as Node) && !this.bubble.contains(event.target as Node)) this.hide();
    }, options);
    this.bubble.addEventListener('pointerenter', () => clearTimeout(this.timer), {signal:this.abort.signal});
    this.bubble.addEventListener('pointerleave', () => this.scheduleHide(), {signal:this.abort.signal});
    doc.defaultView?.addEventListener('resize', () => this.position(), {signal:this.abort.signal});
    doc.addEventListener('scroll', () => this.position(), {...options});
  }
  attach(target: HTMLElement, label: string, text: string, container = target.parentElement!): void {
    const button = this.doc.createElement('button'); button.type='button'; button.className='ad-help-button';
    button.textContent='?'; button.setAttribute('aria-label', `Help: ${label}`);
    button.setAttribute('aria-expanded','false'); container.append(button);
    const owner = this.doc.createElement('span'); owner.className='ad-help-anchor';
    button.replaceWith(owner); owner.append(button);
    this.entries.set(owner,{text,button,target});
    const show = () => this.show(owner, false);
    for (const element of [target, owner]) {
      element.addEventListener('pointerenter', () => { clearTimeout(this.timer); if(!this.pinned) this.timer=setTimeout(show,300); }, {signal:this.abort.signal});
      element.addEventListener('pointerleave', () => this.scheduleHide(), {signal:this.abort.signal});
      element.addEventListener('focusin', () => { if(!this.pinned) show(); }, {signal:this.abort.signal});
      element.addEventListener('focusout', () => this.scheduleHide(), {signal:this.abort.signal});
    }
    button.addEventListener('click', (event) => { event.preventDefault(); event.stopPropagation();
      if(this.active===owner && this.pinned) this.hide(); else this.show(owner,true);
    }, {signal:this.abort.signal});
    target.dataset.help = label; button.dataset.help = label;
    target.setAttribute('aria-describedby', this.bubble.id); button.setAttribute('aria-describedby',this.bubble.id);
  }
  dismissEscape(event: KeyboardEvent): boolean {
    if(this.doc.querySelector('dialog[open]')) { this.hide(); return false; }
    if(event.key!=='Escape' || !this.active) return false;
    event.preventDefault(); event.stopImmediatePropagation(); this.hide(); return true;
  }
  hide(): void { clearTimeout(this.timer); if(this.active) this.entries.get(this.active)?.button.setAttribute('aria-expanded','false'); this.active=null;this.pinned=false;this.bubble.hidden=true; }
  private scheduleHide(): void { clearTimeout(this.timer); if(!this.pinned) this.timer=setTimeout(()=>{const entry=this.active?this.entries.get(this.active):null;if(entry && (this.doc.activeElement===entry.target || this.doc.activeElement===entry.button))return;this.hide();},350); }
  private show(owner: HTMLElement,pinned: boolean): void {
    clearTimeout(this.timer); if(!owner.isConnected) return; this.hide();this.active=owner;this.pinned=pinned;
    const entry=this.entries.get(owner)!;this.bubble.textContent=entry.text;this.bubble.hidden=false;
    // Passive hover/focus help must never intercept the underlying pointer action.
    this.bubble.style.pointerEvents=pinned?'auto':'none';
    entry.button.setAttribute('aria-expanded','true');this.position();
  }
  private position(): void {
    if(!this.active) return; if(!this.active.isConnected){this.hide();return;}
    const r=this.active.getBoundingClientRect(), win=this.doc.defaultView!;
    this.bubble.style.left='8px';this.bubble.style.top='8px';
    const b=this.bubble.getBoundingClientRect();
    this.bubble.style.left=`${Math.max(8,Math.min(r.left,win.innerWidth-b.width-8))}px`;
    const top=r.bottom+6+b.height<=win.innerHeight-8?r.bottom+6:r.top-b.height-6;
    this.bubble.style.top=`${Math.max(8,Math.min(top,win.innerHeight-b.height-8))}px`;
  }
  destroy(): void { this.hide();this.abort.abort();this.bubble.remove(); }
}
