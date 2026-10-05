import test from 'node:test';
import assert from 'node:assert/strict';
import { OrbitAdClient } from '../games/orbit-break/src/ads/OrbitAdClient.ts';
import { GameAdPlayer } from '../games/orbit-break/src/ads/GameAdPlayer.ts';
import { GAME_ID, parseHostMessage } from '../games/orbit-break/src/ads/protocol.ts';
import { OrbitAdFlow } from '../games/orbit-break/src/ads/OrbitAdFlow.ts';
import { RunState } from '../games/orbit-break/src/game/run.ts';
import { createRuntimeConfig } from '../games/orbit-break/src/game/config.ts';
import { AdService } from '../src/ads/service.ts';
import { NullAdAdapter } from '../src/ads/null-adapter.ts';
import { registerGamePlacements, ORBIT_PLACEMENTS } from '../src/ads/placements.ts';
import { createAdBridge } from '../src/ads/bridge.ts';
import { GamePresentationBroker } from '../src/ads/presentation.ts';
import { MockAdAdapter } from '../src/ads/dev/mock-adapter.ts';
import { ProfileStore, PROFILE_KEY } from '../games/orbit-break/src/game/profile.ts';
import { OrbitAudio } from '../games/orbit-break/src/game/audio.ts';
import { readFileSync } from 'node:fs';

function fakeClock() {
  let now = 0, serial = 0;
  const timers = new Map();
  return { now: () => now, set(fn, ms) { const id = ++serial; timers.set(id, { at: now + ms, fn }); return id; }, clear(id) { timers.delete(id); },
    advance(ms) { const end = now + ms; for (;;) { const next = [...timers].sort((a,b) => a[1].at-b[1].at)[0]; if (!next || next[1].at > end) break; now=next[1].at; timers.delete(next[0]); next[1].fn(); } now=end; }, get size() { return timers.size; } };
}
const envelope = { protocol:'odesos-ads', version:1, gameId:GAME_ID };
const capabilities = { providerMode:'mock', fullscreenAvailable:true, rewardedAvailable:true, startupDue:false };
const presentation = { ...envelope, type:'ad-presentation-request', requestId:'req-one', placementId:'orbit.revive', adType:'rewarded',
  courtesy:{enabled:true,preset:'friendly',durationMs:1000,mascot:true,animation:true}, mock:{durationMs:5000,outcome:'completed'}, timeoutMs:11000 };
for(const adType of ['startup','interstitial','rewarded']) test(`${adType} player skip policy and terminal race`,()=>{
  const time=fakeClock(), events=[];let skip;
  const player=new GameAdPlayer({courtesy(){},showing(_p,close){skip=close;},countdown(){},clear(){},destroy(){}},time);
  player.play({...presentation,adType,courtesy:{...presentation.courtesy,enabled:false}},(event,reason)=>events.push({event,reason}));
  skip();skip();time.advance(5001);skip();
  const terminal=events.filter(e=>['ad-presentation-completed','ad-presentation-closed'].includes(e.event));
  assert.equal(terminal.length,1);assert.equal(terminal[0].event,adType==='rewarded'?'ad-presentation-closed':'ad-presentation-completed');
  assert.equal(terminal[0].reason,adType==='rewarded'?'player-skip':undefined);assert.equal(time.size,0);
});
test('developer external close still settles a non-skippable interstitial',()=>{
  const time=fakeClock(),events=[];
  const player=new GameAdPlayer({courtesy(){},showing(){},countdown(){},clear(){},destroy(){}},time);
  player.play({...presentation,adType:'interstitial',courtesy:{...presentation.courtesy,enabled:false},mock:{durationMs:500,outcome:'closed'}},(event,reason)=>events.push({event,reason}));
  time.advance(501);assert.deepEqual(events.at(-1),{event:'ad-presentation-closed',reason:'external-close'});
});
function clientHarness() {
  const time = fakeClock(), sent=[], suspended=[], source={}, rendered=[];
  let emitter;
  const client = new OrbitAdClient({origin:'https://odesosgames.com',source,time,requestTimeoutMs:100,
    send:m=>sent.push(m),suspend:v=>suspended.push(v),changed:()=>{},
    present:(p,emit)=>{rendered.push(p);emitter=emit;return true;},cancelPresentation:()=>{}});
  const receive = (m, extra={})=>client.receive({origin:'https://odesosgames.com',source,data:{...envelope,...m},...extra});
  client.start();
  receive({type:'bridge-ready',requestId:sent[0].requestId,presentationVersion:1,...capabilities});
  return {client,time,sent,suspended,receive,rendered,emit:e=>emitter(e)};
}
test('ready handshake advertises presentation v1 and state reports only transitions',()=>{
  const h=clientHarness();
  assert.equal(h.sent[0].presentationVersion,1);
  h.client.reportState('playing');h.client.reportState('playing');h.client.reportState('paused');h.client.reportState('game-over');
  assert.deepEqual(h.sent.filter(m=>m.type==='game-state').map(m=>m.state),['menu','playing','paused','game-over']);
});
test('host schema rejects malformed presentation payloads, wrong identity and unknown fields',()=>{
  assert.ok(parseHostMessage(presentation));
  for(const patch of [{gameId:'game-002'},{placementId:'orbit.wrong'},{adType:'startup'},{protocol:'other'},{version:2},{extra:true},{mock:{durationMs:Infinity,outcome:'completed'}},{courtesy:{...presentation.courtesy,animation:'yes'}}]) assert.equal(parseHostMessage({...presentation,...patch}),null);
});
test('client authenticates origin/source, ignores unsolicited and out-of-order presentation',async()=>{
  const h=clientHarness(), pending=h.client.request('rewarded','orbit.revive',{userInitiated:true,runId:'run-one'});
  const identity=h.sent.at(-1);
  const p={...presentation,requestId:identity.requestId};
  h.receive(p); assert.equal(h.rendered.length,0);
  h.receive({...identity,type:'ad-accepted',runId:undefined,userInitiated:undefined}); // exact wire event below
  const event={requestId:identity.requestId,placementId:'orbit.revive',adType:'rewarded'};
  h.receive({...event,type:'ad-accepted'});h.receive({...event,type:'ad-will-show'},{origin:'https://wrong.example'});
  assert.equal(h.client.suspended,false);
  h.receive({...event,type:'ad-will-show'}); h.receive(p,{source:{}}); assert.equal(h.rendered.length,0);
  h.receive(p);h.receive(p);assert.equal(h.rendered.length,1);assert.deepEqual(h.suspended,[true]);
  h.emit('ad-presentation-ready');h.emit('ad-presentation-shown');h.emit('ad-presentation-completed');h.emit('ad-presentation-completed');
  assert.equal(h.sent.filter(m=>m.type==='ad-presentation-completed').length,1);
  h.receive({...event,type:'ad-result',runId:'run-one',result:'completed',rewardQualified:true});
  const result=await pending;assert.equal(result.rewardQualified,true);
  h.client.acknowledge(result);h.client.acknowledge(result);
  assert.equal(h.sent.filter(m=>m.type==='reward-granted').length,1);assert.deepEqual(h.suspended,[true,false]);
});
test('cancel and game watchdog settle safely without reward',async()=>{
  for(const cancel of [true,false]) {
    const h=clientHarness();const pending=h.client.request('startup','orbit.startup');const id=h.sent.at(-1).requestId;
    h.receive({type:'ad-accepted',requestId:id,placementId:'orbit.startup',adType:'startup'});
    h.receive({type:'ad-will-show',requestId:id,placementId:'orbit.startup',adType:'startup'});
    if(cancel) h.receive({type:'ad-presentation-cancel',requestId:id,placementId:'orbit.startup',reason:'route-changed'});
    else h.time.advance(101);
    assert.equal((await pending).rewardQualified,false);assert.equal(h.client.suspended,false);assert.equal(h.client.busy,false);
  }
});
test('presentation order, courtesy skip, one terminal and cleanup do not depend on animation',()=>{
  for(const enabled of [true,false]) {
    const time=fakeClock(), events=[], views=[];
    const player=new GameAdPlayer({courtesy:()=>views.push('courtesy'),showing:()=>views.push('showing'),countdown:()=>{},clear:()=>views.push('clear'),destroy:()=>{}},time);
    player.play({...presentation,courtesy:{...presentation.courtesy,enabled,animation:false}},e=>events.push(e));
    assert.equal(events[0],'ad-presentation-ready');
    if(enabled){assert.deepEqual(views,['courtesy']);time.advance(1000);}
    assert.ok(events.includes('ad-presentation-shown'));time.advance(5000);player.cancel();time.advance(10000);
    assert.equal(events.filter(e=>e==='ad-presentation-completed').length,1);assert.equal(time.size,0);
    assert.equal(events.includes('ad-courtesy-started'),enabled);
  }
});
test('preview lifecycle never qualifies a game reward',()=>{
  const h=clientHarness(), identity={requestId:'preview-one',placementId:`dev-${GAME_ID}-rewarded`,adType:'rewarded',preview:true};
  h.receive({...identity,type:'ad-will-show'});assert.equal(h.client.suspended,true);
  h.receive({...identity,type:'ad-result',result:'completed',rewardQualified:true});
  assert.equal(h.client.suspended,false);assert.equal(h.sent.some(m=>m.type==='reward-granted'),false);
});

function flowHarness({startupDue=false,available=true,result='completed',qualified=true,shown=true,deferred=false,reason}={}) {
  const run=new RunState(createRuntimeConfig()), requests=[], acks=[], counts={started:0,revived:0,finalized:0};let resolve;
  const ads={capabilities:{...capabilities,startupDue,fullscreenAvailable:available,rewardedAvailable:available},
    request(type,placement,values={}) {const req={requestId:crypto.randomUUID(),gameId:GAME_ID,adType:type,placementId:placement,...values};requests.push(req);
      const response={...req,result,rewardQualified:qualified,shown,reason};return deferred?new Promise(r=>{resolve=()=>r(response);}):Promise.resolve(response);},acknowledge:r=>acks.push(r)};
  const flow=new OrbitAdFlow(run,ads,{started:()=>counts.started++,revived:()=>counts.revived++,finalized:()=>counts.finalized++,changed:()=>{}});
  return {flow,run,ads,requests,acks,counts,resolve:()=>resolve()};
}
for(const result of ['completed','closed','failed','no_fill','timeout','unavailable']) {
  test(`startup ${result} starts exactly one run without a second fullscreen opportunity`,async()=>{
    const h=flowHarness({startupDue:true,result});await h.flow.requestStartRun();
    assert.deepEqual(h.requests.map(r=>r.placementId),['orbit.startup']);assert.equal(h.run.phase,'playing');assert.equal(h.counts.started,1);
  });
  test(`restart ${result} finalizes once then uses restart-requested and a fresh run identity`,async()=>{
    const h=flowHarness({result});await h.flow.requestStartRun();const before=h.flow.runId;
    h.flow.death();assert.equal(h.requests.length,1);await h.flow.requestStartRun();
    assert.equal(h.requests.at(-1).safeEvent,'restart-requested');assert.notEqual(h.flow.runId,before);assert.equal(h.counts.finalized,1);assert.equal(h.run.phase,'playing');
  });
}
test('startup OFF uses PLAY semantic opportunity; Null skips ads and still plays',async()=>{
  const h=flowHarness();await h.flow.requestStartRun();assert.equal(h.requests[0].safeEvent,'play-requested');
  const n=flowHarness({available:false});await n.flow.requestStartRun();n.flow.death();
  assert.equal(n.requests.length,0);assert.equal(n.flow.offer,false);assert.equal(n.counts.finalized,1);
});
test('startup not-applicable rejection can fall through, without two shown ads',async()=>{
  const h=flowHarness({startupDue:true,result:'blocked',reason:'startup-once-per-session',shown:false});await h.flow.requestStartRun();
  assert.deepEqual(h.requests.map(r=>r.placementId),['orbit.startup','orbit.play-interstitial']);
});
test('rapid input locks the entire asynchronous start; disposal prevents late start',async()=>{
  const h=flowHarness({deferred:true});const p=h.flow.requestStartRun();await h.flow.requestStartRun();assert.equal(h.requests.length,1);
  h.flow.destroy();h.resolve();await p;assert.equal(h.counts.started,0);
});
test('death offers eight seconds with no ad; expiration/menu/restart accounting is once only',async()=>{
  const h=flowHarness();await h.flow.requestStartRun();h.flow.death();assert.equal(h.flow.offerMs,8000);assert.equal(h.counts.finalized,0);assert.equal(h.requests.length,1);
  h.flow.tick(7999);assert.equal(h.counts.finalized,0);h.flow.tick(1);h.flow.finalize();h.flow.menu();assert.equal(h.counts.finalized,1);
});
for(const result of ['closed','failed','no_fill','timeout','unavailable','blocked']) {
  for(const shown of [false,true]) test(`revive ${result}, shown=${shown}: no reward, correct attempt and grace policy`,async()=>{
    const h=flowHarness({result,shown});await h.flow.requestStartRun();h.flow.death();h.flow.tick(7000);await h.flow.revive();
    assert.equal(h.counts.revived,0);assert.equal(h.acks.length,0);assert.equal(h.run.phase,'game-over');
    assert.equal(h.flow.consumed,shown);assert.equal(h.counts.finalized,shown?1:0);if(!shown)assert.equal(h.flow.offerMs,3000);
    assert.equal(h.requests.at(-1).runId,h.flow.runId);assert.equal(h.requests.at(-1).userInitiated,true);
  });
}
test('unqualified completion never revives, even after showing',async()=>{
  const h=flowHarness({qualified:false});await h.flow.requestStartRun();h.flow.death();await h.flow.revive();assert.equal(h.counts.revived,0);assert.equal(h.counts.finalized,1);
});
test('qualified revive preserves identity, score, time, direction and difficulty without finalization',async()=>{
  const h=flowHarness();await h.flow.requestStartRun();h.run.elapsedMs=16000;h.run.score=160;h.run.direction=-1;h.run.difficultyOverride=3;h.run.fire('single',220);
  const id=h.flow.runId;h.flow.death();await h.flow.revive();await h.flow.revive();
  assert.equal(h.flow.runId,id);assert.equal(h.run.score,160);assert.equal(h.run.elapsedMs,16000);assert.equal(h.run.direction,-1);assert.equal(h.run.difficulty,3);
  assert.equal(h.run.projectiles.length,0);assert.equal(h.run.protectionMs,1500);assert.equal(h.run.nextAttackMs,h.run.attackIntervalMs+1000);
  assert.equal(h.counts.revived,1);assert.equal(h.acks.length,1);assert.equal(h.counts.finalized,0);
  h.flow.death();assert.equal(h.flow.offer,false);assert.equal(h.counts.finalized,1);h.flow.finalize();assert.equal(h.counts.finalized,1);
});
test('pending revive freezes offer and rejects duplicate opt-in/restart/menu',async()=>{
  const h=flowHarness({deferred:true});let p=h.flow.requestStartRun();h.resolve();await p;h.flow.death();h.flow.tick(6000);
  p=h.flow.revive();h.flow.tick(20000);await h.flow.revive();await h.flow.requestStartRun();assert.equal(h.flow.menu(),false);
  assert.equal(h.flow.offerMs,2000);assert.equal(h.requests.length,2);h.resolve();await p;assert.equal(h.counts.revived,1);
});
test('revive protection prevents collision and additional attack delay prevents a new formation',()=>{
  const run=new RunState(createRuntimeConfig());run.start();run.revive(1500,1000);run.playerAngle=0;run.config.playerAngularSpeed=0;
  run.projectiles.push({angle:0,distance:120,warningMs:0,ageMs:0,speed:0,group:99,crossed:false,hit:false});
  assert.equal(run.update(16,120,220).collision,false);assert.equal(run.phase,'playing');assert.equal(run.totalProjectiles,0);
  run.protectionMs=0;assert.equal(run.update(16,120,220).collision,true);
});

function serviceHarness() {
  let now=0;const calls=[];
  const provider={name:'MOCK',initialize:async()=>{},isReady:()=>true,prepareAd:async()=> 'ready',showAd:async(req,_signal,shown)=>{calls.push(req);shown();return 'completed';},showBanner:()=>false,hideBanner:()=>{},destroy:()=>{}};
  const service=new AdService(provider,{development:true,now:()=>now});registerGamePlacements(service);service.setContext(GAME_ID);
  const request=(placementId,values={})=>service.request({requestId:crypto.randomUUID(),gameId:GAME_ID,placementId,adType:ORBIT_PLACEMENTS.find(p=>p.id===placementId).adType,...values});
  return {service,calls,request,advance:ms=>{now+=ms;service.tick();}};
}
test('all four approved placements use website slug, exact semantic events and hard revive ceiling',()=>{
  const h=serviceHarness();assert.equal(h.service.placements.size,4);assert.deepEqual(h.service.placements.get('orbit.play-interstitial').safeEvents,['play-requested']);
  assert.deepEqual(h.service.placements.get('orbit.restart-interstitial').safeEvents,['restart-requested']);
  h.service.tunePlacement('orbit.revive',{maxPerRun:9});assert.equal(h.service.placements.get('orbit.revive').maxPerRun,1);
});
test('timer eligibility never shows, non-playing time excluded, PLAY safe event required',async()=>{
  const h=serviceHarness();h.advance(200000);assert.equal(h.service.activeSeconds,0);h.service.setGameState('playing');h.advance(180000);
  assert.equal(h.calls.length,0);assert.equal(h.service.interstitialEligibility().eligible,true);
  assert.equal((await h.request('orbit.play-interstitial',{safeEvent:'run-ended'})).reason,'no-safe-event');
  assert.equal((await h.request('orbit.play-interstitial',{safeEvent:'play-requested'})).result,'completed');assert.equal(h.calls.length,1);
});
for(const reason of ['not-enough-active-play','cooldown','session-cap']) test(`PLAY cannot bypass website ${reason}`,async()=>{
  const h=serviceHarness();h.service.config.interstitial.firstSeconds=0;h.service.nextEligibleAt=reason==='not-enough-active-play'?180:0;
  if(reason==='cooldown')h.service.interstitialCooldownAt=0;
  if(reason==='session-cap'){h.service.config.interstitial.sessionLimitEnabled=true;h.service.interstitialCount=3;}
  assert.equal((await h.request('orbit.play-interstitial',{safeEvent:'play-requested'})).reason,reason);assert.equal(h.calls.length,0);
});
test('host shown-run cap survives stats reset and rejects missing run context',async()=>{
  const h=serviceHarness();assert.equal((await h.request('orbit.revive',{userInitiated:true})).reason,'run-context-required');
  assert.equal((await h.request('orbit.revive',{userInitiated:true,runId:'run-one'})).rewardQualified,true);h.service.clearStats();
  assert.equal((await h.request('orbit.revive',{userInitiated:true,runId:'run-one'})).reason,'placement-run-cap');
  assert.equal((await h.request('orbit.revive',{userInitiated:true,runId:'run-two'})).rewardQualified,true);
});
test('Null capabilities are honest; placement and global rewarded controls update availability',()=>{
  const n=new AdService(new NullAdAdapter());registerGamePlacements(n);assert.equal(n.capabilities(GAME_ID).fullscreenAvailable,false);assert.equal(n.capabilities(GAME_ID).rewardedAvailable,false);
  const h=serviceHarness();h.service.tunePlacement('orbit.revive',{enabled:false});assert.equal(h.service.capabilities(GAME_ID).rewardedAvailable,false);
  h.service.tunePlacement('orbit.revive',{enabled:true});assert.equal(h.service.capabilities(GAME_ID).rewardedAvailable,true);
  h.service.configure({...h.service.config,rewarded:{...h.service.config.rewarded,enabled:false}});assert.equal(h.service.capabilities(GAME_ID).rewardedAvailable,false);
});
test('real host bridge -> mock provider -> broker -> game client -> renderer completes and acknowledges once',async()=>{
  const time=fakeClock(), broker=new GamePresentationBroker(), child={},host={},wire=[],suspension=[];
  const service=new AdService(new MockAdAdapter(()=>service.config,()=>{},broker),{development:true});registerGamePlacements(service);service.setContext(GAME_ID);service.config.mock.loadingMs=0;
  const player=new GameAdPlayer({courtesy:()=>{},showing:()=>{},countdown:()=>{},clear:()=>{},destroy:()=>{}},time);
  let bridge;const client=new OrbitAdClient({origin:'https://local.test',source:host,time,send:m=>{wire.push(m);queueMicrotask(()=>bridge.receive({origin:'https://local.test',source:child,data:m}));},suspend:v=>suspension.push(v),changed:()=>{},present:(p,e)=>player.play(p,e),cancelPresentation:()=>player.cancel()});
  const send=m=>queueMicrotask(()=>client.receive({origin:'https://local.test',source:host,data:{...envelope,...m}}));
  broker.bind(GAME_ID,send);bridge=createAdBridge(service,{origin:'https://local.test',source:child,gameId:GAME_ID,send,presentation:broker});
  client.start();await new Promise(r=>setTimeout(r,0));assert.equal(client.connected,true);assert.equal(broker.rendererReady,true);
  const pending=client.request('rewarded','orbit.revive',{userInitiated:true,runId:'live-run'});await new Promise(r=>setTimeout(r,10));
  assert.deepEqual(suspension,[true]);time.advance(6000);await new Promise(r=>setTimeout(r,0));
  const result=await pending;assert.equal(result.rewardQualified,true);assert.equal(result.shown,true);client.acknowledge(result);client.acknowledge(result);await new Promise(r=>setTimeout(r,0));
  assert.equal(service.rewardAcknowledgments,1);assert.equal(service.stats.rewarded.shown,1);assert.deepEqual(suspension,[true,false]);
  assert.equal(wire.filter(m=>m.type==='ad-presentation-completed').length,1);client.destroy();bridge.dispose();player.destroy();service.destroy();
});

test('profile accounting persists one finished score and one runs quest update, including zero score',async()=>{
  const values=new Map();let writes=0;
  globalThis.window={localStorage:{getItem:k=>values.get(k)??null,setItem:(k,v)=>{values.set(k,v);if(k===PROFILE_KEY)writes++;}}};
  const config=createRuntimeConfig(),profile=new ProfileStore(config),run=new RunState(config);
  profile.data.quests[0]={kind:'runs',target:10,progress:0,xpReward:10,starReward:1};writes=0;
  const ads={capabilities:{...capabilities,fullscreenAvailable:false},request:async(type,placement,values)=>({requestId:'record-test',gameId:GAME_ID,adType:type,placementId:placement,...values,result:'completed',shown:true,rewardQualified:true}),acknowledge:()=>{}};
  const flow=new OrbitAdFlow(run,ads,{started:()=>{},revived:()=>{},changed:()=>{},finalized:()=>profile.recordFinishedRun(run.score)});
  await flow.requestStartRun();run.score=125;flow.death();await flow.revive();assert.equal(writes,0);assert.equal(profile.data.quests[0].progress,0);
  flow.death();flow.finalize();assert.equal(writes,1);assert.deepEqual(profile.data.scores,[125]);assert.equal(profile.data.quests[0].progress,1);
  await flow.requestStartRun();flow.menu();assert.equal(writes,2);assert.equal(profile.data.quests[0].progress,2);assert.deepEqual(profile.data.scores,[125]);
});
test('audio ad suspension mutes existing sound and blocks music without changing settings',async()=>{
  const gains=[],timers=new Set();let serial=0;
  const parameter=()=>({value:1,setValueAtTime(){},exponentialRampToValueAtTime(){}});
  class AudioContext {state='running';currentTime=0;destination={};createGain(){const node={gain:parameter(),connect(){}};gains.push(node);return node;}createOscillator(){return{frequency:parameter(),connect(){},start(){},stop(){}};}close(){return Promise.resolve();}}
  globalThis.window={AudioContext,setInterval:()=>{timers.add(++serial);return serial;},clearInterval:id=>timers.delete(id)};
  const audio=new OrbitAudio(createRuntimeConfig());audio.settings={master:.4,music:.3,sfx:.2,mute:false};await audio.unlock();audio.startMusic();assert.equal(timers.size,1);
  const before={...audio.settings};audio.suspendForAd(true);assert.equal(gains[0].gain.value,0);assert.equal(timers.size,0);audio.startMusic();assert.equal(timers.size,0);assert.deepEqual(audio.settings,before);
  audio.suspendForAd(false);assert.equal(gains[0].gain.value,.4);audio.startMusic();assert.equal(timers.size,1);audio.destroy();assert.equal(timers.size,0);
});
test('ad lifecycle wiring blocks Phaser input and ordinary UI, with DEV shortcut respecting inert',()=>{
  const scene=readFileSync(new URL('../games/orbit-break/src/game/OrbitBreakScene.ts',import.meta.url),'utf8');
  const ui=readFileSync(new URL('../games/orbit-break/src/game/ui.ts',import.meta.url),'utf8');
  const dev=readFileSync(new URL('../games/orbit-break/src/dev/DevPanel.ts',import.meta.url),'utf8');
  assert.match(scene,/this\.input\.enabled = !value/);assert.match(scene,/if \(this\.adSuspended\) return/);assert.match(scene,/this\.audio\.suspendForAd\(value\)/);
  assert.match(ui,/this\.root\.inert = value/);assert.match(ui,/if \(this\.blocked\) return/);assert.match(dev,/if \(this\.root\.inert\) return/);
});
test('stale, wrong-run and duplicate result cannot release or reward a newer request',async()=>{
  const h=clientHarness();const p=h.client.request('rewarded','orbit.revive',{runId:'run-current',userInitiated:true});const requestId=h.sent.at(-1).requestId;
  const result={type:'ad-result',requestId,placementId:'orbit.revive',adType:'rewarded',result:'completed',rewardQualified:true,runId:'run-wrong'};
  h.receive(result);assert.equal(h.client.busy,true);h.receive({...result,runId:'run-current',requestId:'stale'});assert.equal(h.client.busy,true);
  h.receive({...result,runId:'run-current'});assert.equal((await p).rewardQualified,false);h.receive({...result,runId:'run-current'});assert.equal(h.client.busy,false);
});
test('capability changes cannot be widened by generic DEV preview placements',()=>{
  const h=serviceHarness();h.service.register({id:`dev-${GAME_ID}-rewarded`,gameId:GAME_ID,adType:'rewarded',enabled:true,cooldownSeconds:0,maxPerSession:100});
  h.service.tunePlacement('orbit.revive',{maxPerRun:0});assert.equal(h.service.capabilities(GAME_ID).rewardedAvailable,false);
});
test('renderer failures emit one failure; cancellation removes countdown callbacks',()=>{
  const events=[],time=fakeClock();
  const player=new GameAdPlayer({courtesy:()=>{throw new Error('view unavailable');},showing:()=>{},countdown:()=>{},clear:()=>{},destroy:()=>{}},time);
  player.play(presentation,e=>events.push(e));time.advance(30000);assert.deepEqual(events,['ad-presentation-ready','ad-presentation-failed']);assert.equal(time.size,0);
});
test('production renderer absence does not falsely advertise presentation support',()=>{
  const sent=[];const client=new OrbitAdClient({origin:'https://local.test',source:{},send:m=>sent.push(m),suspend:()=>{},changed:()=>{},present:()=>false,cancelPresentation:()=>{},presentationReady:()=>false});
  client.start();assert.equal(sent[0].presentationVersion,undefined);client.destroy();
});
test('broker completion deadline includes the visual duration after readiness',async()=>{
  const broker=new GamePresentationBroker(),h=serviceHarness();broker.bind(GAME_ID,()=>{});broker.ready(GAME_ID,1);
  const config=h.service.config;config.mock.presentationTimeoutMs=15;config.mock.durationMs=50;config.courtesy.enabled=false;
  const identity={requestId:'deadline-test',gameId:GAME_ID,placementId:'orbit.revive'};
  const result=broker.present({...identity,adType:'rewarded'},config,'completed',new AbortController().signal,()=>{});
  broker.receive({...identity,type:'ad-presentation-ready'});broker.receive({...identity,type:'ad-presentation-shown'});
  await new Promise(r=>setTimeout(r,30));assert.equal(broker.receive({...identity,type:'ad-presentation-completed'}),true);
  assert.equal((await result).result,'completed');broker.unbind(GAME_ID);
});
