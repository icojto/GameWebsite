import { spawn } from 'node:child_process';
import { mkdir, writeFile, appendFile, readFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { identity } from './build-identity.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const mode=process.argv[2];const args=process.argv.slice(3);
const port=Number(args[args.indexOf('--port')+1] ?? (mode==='dev'?5191:5192));
if(!['dev','preview','doctor'].includes(mode)||!Number.isInteger(port)||port<1024||port>65535)throw Error('Use qa:dev/qa:preview/qa:doctor -- --port 5191');
const out=path.join(root,'outputs','qa-launch');await mkdir(out,{recursive:true});
if(mode==='doctor'){console.log(await readFile(path.join(out,'latest.json'),'utf8'));process.exit(0)}
const meta=identity(mode==='dev'?'development':'production');const session=mode==='dev'?randomUUID():null;
const url=`http://127.0.0.1:${port}/games/reactor-stack/${session?'?qa='+session:''}`;
const manifest={schema:1,instance:randomUUID(),...meta,session,command:process.argv.join(' '),cwd:root,port,url,pid:null,stages:{process:'pending',http:'pending',routes:'pending',browser:'BROWSER_NOT_VERIFIED',game:'NOT_VERIFIED'},failure:null,nextStep:'Open the URL in the browser and compare build identity, mounted canvas and actual bridge/renderer capability.'};
const save=()=>writeFile(path.join(out,'latest.json'),JSON.stringify(manifest,null,2));
let child=null,closing=false;
const stop=()=>{closing=true;child?.kill('SIGINT')};process.on('SIGINT',stop);process.on('SIGTERM',stop);
async function run(command,argv){return new Promise((resolve,reject)=>{child=spawn(command,argv,{cwd:root,env:{...process.env,ODESOS_BUILD_META:JSON.stringify(meta),VITE_QA_SESSION:session??''},stdio:['inherit','pipe','pipe']});manifest.pid=child.pid;child.stdout.on('data',b=>{process.stdout.write(b);void appendFile(path.join(out,manifest.instance+'.log'),b)});child.stderr.on('data',b=>{process.stderr.write(b);void appendFile(path.join(out,manifest.instance+'.log'),b)});child.once('error',reject);child.once('exit',code=>code===0||closing?resolve():reject(Error('Owned process exited '+code)))});}
try{
 await new Promise((resolve,reject)=>{const probe=createServer();probe.once('error',()=>reject(Error('port-conflict')));probe.listen(port,'127.0.0.1',()=>probe.close(resolve))});
 manifest.stages.process='building';await save();
 await run(process.execPath,mode==='dev'?[path.join(root,'scripts/build-games.mjs')]:[process.env.npm_execpath,'run','build']);
 if(closing)process.exit(130);
 manifest.stages.process='started';
 const server=run(process.execPath,[path.join(root,'node_modules/vite/bin/vite.js'),...(mode==='preview'?['preview']:[]),'--host','127.0.0.1','--port',String(port),'--strictPort']);
 let processFailure=null;server.catch(error=>{processFailure=error});
 const deadline=Date.now()+20000;let checked=false;
 while(Date.now()<deadline&&!closing){if(processFailure)throw processFailure;try{
  const response=await fetch(url,{signal:AbortSignal.timeout(1500)});if(!response.ok)throw Error('http');const html=await response.text();manifest.stages.http='reachable';
  const encoded=html.match(/name="odesos-build" content="([^"]+)"/);if(!encoded||!encoded[1].includes(meta.id))throw Error('mixed-build-identity');
  for(const slug of ['orbit-break','reactor-stack']){const entry=`http://127.0.0.1:${port}/games/${slug}/embed/index.html`;const page=await fetch(entry);const text=await page.text();if(!page.ok||!text.includes(meta.id))throw Error('wrong-route-or-mixed-identity');const sources=[...text.matchAll(/<script[^>]*src="([^"]+)"/g)].map(match=>match[1]);if(!sources.length)throw Error('missing-module');for(const source of sources){const module=await fetch(new URL(source,entry));if(!module.ok||!(module.headers.get('content-type')??'').match(/javascript|ecmascript/))throw Error('wrong-module-route');}}
  manifest.stages.routes='portal-and-both-iframe-modules-verified';checked=true;break;
 }catch(error){manifest.failure=error.message;await new Promise(resolve=>setTimeout(resolve,300))}}
 if(!checked)throw Error(manifest.failure??'http-timeout');manifest.failure=null;await save();console.log(`QA ${mode}: ${url}\nBuild ${meta.id}, revision ${meta.revision}, dirty=${meta.dirty}\nStages 1–3 verified. BROWSER_NOT_VERIFIED. Manifest: ${path.join(out,'latest.json')}`);await server;
}catch(error){manifest.failure=error.message;manifest.nextStep=error.message==='port-conflict'?'Choose an unused explicit port; do not stop the unknown process.':'Inspect the owned launch log; rebuild/restart this checkout before browser verification.';stop();await save();console.error(manifest.failure+' — '+manifest.nextStep);process.exitCode=1;}
