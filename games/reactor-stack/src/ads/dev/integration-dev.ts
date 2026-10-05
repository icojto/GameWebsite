import { GameAdPlayer } from '../GameAdPlayer.ts';
import { createMockAdView } from './MockAdView.ts';
import type { ReactorAdFlow } from '../ReactorAdFlow.ts';
import type { ReactorAdClient } from '../ReactorAdClient.ts';
import type { TurnController } from '../../rules.ts';
import { ContextHelp } from '../../../../../shared/dev/help.ts';
import '../../../../../shared/dev/help.css';
import './integration.css';

export function mountAdsDev(api: { flow: ReactorAdFlow; client: ReactorAdClient; controller: TurnController; refresh(): void }) {
  const { flow, client, controller } = api;
  const player = new GameAdPlayer(createMockAdView(document.body));
  const help = new ContextHelp(document);
  const why = document.createElement('button'); why.textContent = 'Why Ads?'; why.className = 'dialog-button'; why.hidden = true;
  document.querySelector('.menu-dialog')!.append(why);
  const panel = document.createElement('section'); panel.className = 'overlay reactor-why'; panel.hidden = true;
  panel.innerHTML = '<div class="dialog" role="dialog" aria-modal="true" aria-labelledby="why-title"><h2 id="why-title">Why Ads?</h2><p>This build tests optional advertising with mock presentations only. No real advertiser or revenue is involved.</p><p>Starting a run or deliberately pausing may show a mock ad when the website permits it. Each depleted power-up offers one optional ad attempt per run for +1 charge. Completing a qualified ad refills the charge; it never uses the power-up automatically. Skipping a shown rewarded ad uses that attempt and gives no reward.</p><button class="dialog-button">Close</button></div>';
  document.body.append(panel);
  let prior: HTMLElement | null = null;
  const close = () => { panel.hidden = true; if(prior?.isConnected)prior.focus(); };
  const open = () => { if(flow.locked)return; prior=document.activeElement as HTMLElement; panel.hidden=false; panel.querySelector('button')!.focus(); };
  why.onclick = open; panel.querySelector('button')!.onclick=close;
  const key=(event:KeyboardEvent)=>{if(panel.hidden)return;if(event.key==='Escape'){event.preventDefault();close();}if(event.key==='Tab'){event.preventDefault();panel.querySelector('button')!.focus();}};
  window.addEventListener('keydown',key);
  help.attach(why,'Why Ads','Mock-phase explanation only. No ad request or reward. Close or Escape returns focus. Available only with a mock host.',why.parentElement!);
  help.attach(panel.querySelector('button')!,'Close explanation','Closes this information panel without requesting advertising or changing the run. Escape also closes it.');
  const details=document.createElement('details');details.className='dev-section';details.open=true;
  details.innerHTML='<summary>Ads Integration</summary><div class="dev-section-body"></div>';
  const body=details.querySelector('div')!;
  const outputs = new Map<string, HTMLOutputElement>();
  const diagnostic=(name:string,description:string)=>{
    const row=document.createElement('div');row.className='dev-live';const label=document.createElement('span');label.textContent=name+' ';label.tabIndex=0;
    const output=document.createElement('output');row.append(label,output);body.append(row);outputs.set(name,output);
    help.attach(label,name,description,row);
  };
  diagnostic('Bridge / renderer','Read-only connection, host capabilities and mounted renderer. Capabilities are hints, not authorization. Standalone and production Null do not offer ads. Resets on reload.');
  diagnostic('Run / phase','Opaque current run ID and actual controller phase. ID changes only on a fresh run; rotation, Pause and ads preserve it. RAM only.');
  diagnostic('Locks','Pending Start, Pause, refill or presentation locks board input. A queued Pause waits for the committed turn only. No independent host clocks. RAM only.');
  diagnostic('Last placement / result','Most recent game request and host outcome, including refusal reason. Website previews do not grant inventory. RAM only.');
  diagnostic('Cool Core','Inventory, shown-attempt consumed, total charges granted and actual charges used. Default one free charge; approved refill +1. One shown attempt per run; skip consumes it; pre-show failure does not.');
  diagnostic('Upgrade','Inventory, shown-attempt consumed, total charges granted and actual charges used. Default one free charge; approved refill +1. Reward receipt does not arm Upgrade. Independent of Cool Core.');
  for(const [label,power] of [['Starting Cool charges','cool'],['Starting Upgrade charges','upgrade']] as const){
    const row=document.createElement('label');row.className='dev-field';row.textContent=label+' · NEXT RUN';
    const input=document.createElement('input');input.dataset.startPower=power;input.type='number';input.min='0';input.max='20';input.value=String(controller.runtimeConfig[power==='cool'?'coolCoreUses':'upgradeUses']);
    input.onchange=()=>{if(flow.locked)return;const value=Number(input.value);if(Number.isInteger(value)&&value>=0&&value<=20)controller.runtimeConfig[power==='cool'?'coolCoreUses':'upgradeUses']=value;};
    row.append(input);body.append(row);help.attach(input,label,'Charges per fresh run. Default 1. NEXT RUN; memory-only tuning, reload restores defaults. Does not change the approved +1 refill or one shown-attempt ceiling.',row);
  }
  const action=(label:string,description:string,fn:()=>void)=>{
    const row=document.createElement('div');const button=document.createElement('button');button.textContent=label;row.append(button);body.append(row);
    button.onclick=()=>{if(flow.locked||controller.phase==='RESOLVING')return;fn();api.refresh();};
    help.attach(button,label,description,row);
  };
  action('DEV: deplete Cool charge','Sets current Cool inventory to zero at a safe boundary for testing. Does not count as use, grant, or ad acknowledgment. Cannot reset host cap history. RAM only.',()=>controller.state.coolCoreRemaining=0);
  action('DEV: deplete Upgrade charge','Sets current Upgrade inventory to zero for testing. Does not count as use or grant. Cannot restore a spent shown-attempt allowance. RAM only.',()=>controller.state.upgradeRemaining=0);
  action('Preview Why Ads','Opens the mock explanation without requesting an ad or reward. Safe-boundary only; Close or Escape returns focus.',open);
  // Existing panel is loaded asynchronously. Attach once, independent of its redraws.
  const update=()=>{
    const host=document.getElementById('reactor-ads-dev');if(host&&!details.isConnected)host.append(details);
    why.hidden=client.capabilities.providerMode!=='mock'||!client.capabilities.fullscreenAvailable||controller.phase!=='MENU';
    const helpAnchor=why.parentElement?.querySelector<HTMLElement>('.ad-help-anchor');if(helpAnchor)helpAnchor.hidden=why.hidden;
    const s=controller.state;
    body.querySelectorAll<HTMLInputElement>('[data-start-power]').forEach(input=>{if(document.activeElement!==input)input.value=String(controller.runtimeConfig[input.dataset.startPower==='cool'?'coolCoreUses':'upgradeUses']);});
    outputs.get('Bridge / renderer')!.textContent=`${client.connected?'connected':'disconnected'} / mounted / ${client.capabilities.providerMode}; fullscreen ${client.capabilities.fullscreenAvailable}; rewarded ${client.capabilities.rewardedAvailable}`;
    outputs.get('Run / phase')!.textContent=`${flow.runId||'none'} / ${controller.phase}`;
    outputs.get('Locks')!.textContent=`pending ${flow.pending??'none'}; queued Pause ${flow.pauseQueued}; presentation ${client.suspended}`;
    outputs.get('Last placement / result')!.textContent=`${flow.lastPlacement} / ${flow.lastResult}; client ${client.lastResult}`;
    outputs.get('Cool Core')!.textContent=`${s.coolCoreRemaining}; attempt ${flow.attempts.cool}; granted ${s.coolGranted}; used ${s.coolUsed}; refill +1`;
    outputs.get('Upgrade')!.textContent=`${s.upgradeRemaining}; attempt ${flow.attempts.upgrade}; granted ${s.upgradeGranted}; used ${s.upgradeUsed}; refill +1`;
  };
  const timer=setInterval(update,250);update();
  return {player,update,destroy:()=>{clearInterval(timer);help.destroy();details.remove();why.remove();panel.remove();window.removeEventListener('keydown',key);}};
}
