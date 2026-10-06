import { ContextHelp } from './help.ts';
import './qa.css';
import './help.css';
import { gameStorage, qaSession } from '../storage.mjs';
import { Confirmation } from './confirmation.ts';
export const serialize = (value: unknown) => JSON.stringify(value, (_key,value)=>typeof value==='number'&&!Number.isFinite(value)?null:value, 2);
export function downloadJson(name:string, text:string):void { const url=URL.createObjectURL(new Blob([text],{type:'application/json'}));const link=document.createElement('a');link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000); }
export function mountInspection(parent:HTMLElement, game:string, state:()=>object, config:()=>unknown, safe:()=>boolean=()=>true) {
  const doc=parent.ownerDocument, section=doc.createElement('section');section.className='qa-inspection';section.dataset.testid=game+'-qa';
  const help=new ContextHelp(doc), confirmation=new Confirmation(doc,()=>gameStorage.scope,safe);let sequence=0;
  const title=doc.createElement('h3');title.textContent='QA inspection';const scope=doc.createElement('p');scope.textContent='Storage: '+gameStorage.scope;scope.dataset.testid='qa-storage-scope';section.append(title,scope);parent.append(section);
  help.attach(scope,'Storage scope','QA uses only this disposable namespace. Ordinary DEV uses existing origin keys. Reload preserves saved data; a new launcher session starts empty.',section);
  const output=doc.createElement('pre');output.hidden=true;output.dataset.testid='qa-json';output.tabIndex=0;
  const sample=()=>({schemaVersion:1,sequence:++sequence,sampledAt:new Date().toISOString(),session:qaSession,mode:'development',build:JSON.parse(doc.querySelector('meta[name="odesos-build"]')?.getAttribute('content')??'null'),game,...state()});
  function action(label:string,id:string,detail:string,run:()=>void){const row=doc.createElement('div'),button=doc.createElement('button');button.type='button';button.textContent=label;button.dataset.testid=id;button.onclick=run;row.append(button);section.append(row);help.attach(button,label,detail,row)}
  action('Refresh snapshot','qa-refresh','Samples authoritative state without changing the run, RNG, reward inventory or timers. Time is ISO UTC; elapsed game time is milliseconds.',()=>{output.textContent=serialize(sample());output.hidden=false});
  action('View snapshot JSON','qa-view-snapshot','Readable/selectable snapshot. Inspection does not certify rendering, touch, audio or clipboard behavior.',()=>{output.textContent=serialize(sample());output.hidden=false});
  action('Download snapshot JSON','qa-download-snapshot','Downloads the same snapshot schema; no game mutation. Each sample has a new diagnostic sequence/time.',()=>downloadJson(game+'-snapshot.json',serialize(sample())));
  action('View config JSON','qa-view-config','Read-only current runtime configuration. Uses the same JSON serialization as Copy/Download; no clipboard claim.',()=>{output.textContent=serialize(config());output.hidden=false});
  action('Download config JSON','qa-download-config','Downloads current configuration; does not persist tuning or alter gameplay.',()=>downloadJson(game+'-config.json',serialize(config())));
  if(qaSession)action('Reset current QA namespace…','qa-reset-namespace','Deletes saved portal/ad configuration and both games’ profiles, scores and mute in this session only. Reload afterward. Active host ad history remains.',()=>{void confirmation.ask('Reset current QA namespace','Delete all saved keys in this QA session, including both games, portal preferences and ad DEV settings. Active runs and host safety history remain. Reload to re-read defaults.').then(accepted=>{if(accepted){try{gameStorage.resetSession();}catch{scope.textContent='QA storage is denied; in-memory state cleared. Reload to re-read.';return;}scope.textContent='Deleted saved namespace: '+gameStorage.scope+'; reload to read defaults.'}})});
  section.append(output);help.attach(output,'Snapshot/config JSON','Read-only serialized sample. ISO UTC timestamp, elapsed milliseconds, angle radians, direction ±1, raw heat/capacity, inventory counts and actual shown/use/grant counters. No mutable engine objects; refresh is explicit.',section);return {sample,destroy(){confirmation.destroy();help.destroy();section.remove()}};
}
