import './qa.css';
import { ContextHelp } from './help.ts';
import './help.css';
/** One outstanding owner-document operation. Context/disposal cancels it. */
export class Confirmation {
  private cancel: (() => void) | null = null;
  private alive = true;
  constructor(private doc: Document, private scope: () => string, private safe: () => boolean) {}
  async ask(title: string, detail: string, trigger: HTMLElement | null = this.doc.activeElement as HTMLElement): Promise<boolean> {
    if (!this.alive || this.cancel || !this.safe()) return false;
    const context=this.scope(), dialog=this.doc.createElement('dialog');dialog.className='qa-confirmation';dialog.dataset.testid='qa-confirmation';
    const heading=this.doc.createElement('h2');heading.id='qa-confirmation-title';heading.textContent=title;dialog.setAttribute('aria-labelledby',heading.id);
    const description=this.doc.createElement('p');description.textContent=detail+' Storage scope: '+context+'.';
    const cancel=this.doc.createElement('button');cancel.type='button';cancel.textContent='Cancel';cancel.dataset.testid='qa-cancel';
    const confirm=this.doc.createElement('button');confirm.type='button';confirm.textContent='Confirm '+title;confirm.dataset.testid='qa-confirm';
    dialog.append(heading,description,cancel,confirm);this.doc.body.append(dialog);
    const help=new ContextHelp(this.doc);help.attach(description,'Reset scope','Only the described data is changed. Host ad safety history and other storage sessions are retained.',dialog);
    return new Promise(resolve=>{
      let done=false;
      const finish=(accepted:boolean)=>{if(done)return;done=true;this.cancel=null;help.destroy();dialog.close();dialog.remove();if(trigger?.isConnected)trigger.focus({preventScroll:true});resolve(accepted&&this.alive&&context===this.scope()&&this.safe());};
      this.cancel=()=>finish(false);cancel.onclick=()=>finish(false);confirm.onclick=()=>finish(true);
      dialog.addEventListener('cancel',event=>{event.preventDefault();event.stopImmediatePropagation();finish(false)});
      dialog.addEventListener('close',()=>finish(false));
      dialog.addEventListener('keydown',event=>{
        event.stopPropagation();if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();finish(false)}
        if(event.key==='Tab'){const buttons=[...dialog.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')];const index=buttons.indexOf(this.doc.activeElement as HTMLButtonElement);if(event.shiftKey&&index<=0){event.preventDefault();buttons.at(-1)?.focus()}else if(!event.shiftKey&&index===buttons.length-1){event.preventDefault();buttons[0]?.focus()}}
      });
      dialog.showModal();cancel.focus();
    });
  }
  invalidate(): void { this.cancel?.(); }
  destroy(): void { this.alive=false;this.invalidate(); }
}
