import test from 'node:test';
import assert from 'node:assert/strict';
import { ReactorAdClient } from '../games/reactor-stack/src/ads/ReactorAdClient.ts';
import { GameAdPlayer } from '../games/reactor-stack/src/ads/GameAdPlayer.ts';
import { GAME_ID, parseHostMessage } from '../games/reactor-stack/src/ads/protocol.ts';
import { AdService } from '../src/ads/service.ts';
import { NullAdAdapter } from '../src/ads/null-adapter.ts';
import { registerGamePlacements, ORBIT_PLACEMENTS } from '../src/ads/placements.ts';
import { createAdBridge } from '../src/ads/bridge.ts';
import { GamePresentationBroker } from '../src/ads/presentation.ts';
import { MockAdAdapter } from '../src/ads/dev/mock-adapter.ts';
import { readFileSync } from 'node:fs';

function fakeClock() {
  let now = 0, serial = 0;
  const timers = new Map();
  return { now: () => now, set(fn, ms) { const id = ++serial; timers.set(id, { at: now + ms, fn }); return id; }, clear(id) { timers.delete(id); },
    advance(ms) { const end = now + ms; for (;;) { const next = [...timers].sort((a,b) => a[1].at-b[1].at)[0]; if (!next || next[1].at > end) break; now=next[1].at; timers.delete(next[0]); next[1].fn(); } now=end; }, get size() { return timers.size; } };
}
const envelope = { protocol:'odesos-ads', version:1, gameId:GAME_ID };
const capabilities = { providerMode:'mock', fullscreenAvailable:true, rewardedAvailable:true, startupDue:false };
const presentation = { ...envelope, type:'ad-presentation-request', requestId:'req-one', placementId:'reactor.cool-refill', adType:'rewarded',
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
  const client = new ReactorAdClient({origin:'https://odesosgames.com',source,time,requestTimeoutMs:100,
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
  assert.deepEqual(h.sent.filter(m=>m.type==='game-state').map(m=>m.state),['unknown','playing','paused','game-over']);
});
test('host schema rejects malformed presentation payloads, wrong identity and unknown fields',()=>{
  assert.ok(parseHostMessage(presentation));
  for(const patch of [{gameId:'game-002'},{placementId:'reactor.wrong'},{adType:'startup'},{protocol:'other'},{version:2},{extra:true},{mock:{durationMs:Infinity,outcome:'completed'}},{courtesy:{...presentation.courtesy,animation:'yes'}}]) assert.equal(parseHostMessage({...presentation,...patch}),null);
});
test('client authenticates origin/source, ignores unsolicited and out-of-order presentation',async()=>{
  const h=clientHarness(), pending=h.client.request('rewarded','reactor.cool-refill',{userInitiated:true,runId:'run-one'});
  const identity=h.sent.at(-1);
  const p={...presentation,requestId:identity.requestId};
  h.receive(p); assert.equal(h.rendered.length,0);
  h.receive({...identity,type:'ad-accepted',runId:undefined,userInitiated:undefined}); // exact wire event below
  const event={requestId:identity.requestId,placementId:'reactor.cool-refill',adType:'rewarded'};
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
    const h=clientHarness();const pending=h.client.request('startup','reactor.startup');const id=h.sent.at(-1).requestId;
    h.receive({type:'ad-accepted',requestId:id,placementId:'reactor.startup',adType:'startup'});
    h.receive({type:'ad-will-show',requestId:id,placementId:'reactor.startup',adType:'startup'});
    if(cancel) h.receive({type:'ad-presentation-cancel',requestId:id,placementId:'reactor.startup',reason:'route-changed'});
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


import { ReactorAdFlow } from '../games/reactor-stack/src/ads/ReactorAdFlow.ts';
import { TurnController } from '../games/reactor-stack/src/rules.ts';
import { ReactorAudio } from '../games/reactor-stack/src/audio.ts';
import { REACTOR_PLACEMENTS } from '../src/ads/placements.ts';

function reactorHarness({startupDue=false,available=true,result='completed',qualified=true,shown=true,deferred=false,reason}={}) {
  let rng=0,started=0,resolve; const requests=[],acks=[];
  const controller=new TurnController(()=>{rng++;return .2;});controller.setMenu();
  const ads={capabilities:{...capabilities,startupDue,fullscreenAvailable:available,rewardedAvailable:available},
    request(type,placement,values={}){const req={requestId:crypto.randomUUID(),gameId:GAME_ID,adType:type,placementId:placement,...values};requests.push(req);
      const response={...req,result,rewardQualified:qualified,shown,reason};return deferred?new Promise(r=>{resolve=(patch={})=>r({...response,...patch});}):Promise.resolve(response);},acknowledge:r=>acks.push(r)};
  const flow=new ReactorAdFlow(controller,ads,{start(){started++;controller.start();},changed(){},cancelGesture(){},feedback(){}});
  return {flow,controller,ads,requests,acks,resolve:(patch)=>resolve(patch),get started(){return started;},get rng(){return rng;}};
}
test('audio suspension stops current cues without changing player mute or volume',()=>{
 const previous=globalThis.AudioContext;let starts=0,stops=0;
 globalThis.AudioContext=class {currentTime=0;destination={};resume(){return Promise.resolve();}createGain(){return{gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){},disconnect(){}};}createOscillator(){return{frequency:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){},disconnect(){},start(){starts++;},stop(){stops++;}};}};
 try{const audio=new ReactorAudio();audio.volume=.3;audio.play('move');audio.suspendForAd(true);audio.play('merge');assert.equal(starts,1);assert.equal(stops,2);assert.equal(audio.muted,false);assert.equal(audio.volume,.3);audio.suspendForAd(false);audio.play('move');assert.equal(starts,2);audio.setMuted(true);audio.suspendForAd(true);audio.suspendForAd(false);audio.play('move');assert.equal(starts,2);}finally{globalThis.AudioContext=previous;}
});
test('shared host separates both power-up run ceilings and suppresses immediate interstitial stacking',async()=>{
 const h=serviceHarness();h.service.devAction('eligible');
 await h.request('reactor.cool-refill',{runId:'same-run',userInitiated:true});
 assert.equal((await h.request('reactor.upgrade-refill',{runId:'same-run',userInitiated:true})).rewardQualified,true);
 assert.equal((await h.request('reactor.cool-refill',{runId:'same-run',userInitiated:true})).reason,'placement-run-cap');
 assert.equal((await h.request('reactor.start-interstitial',{safeEvent:'start-requested'})).reason,'cooldown');
});
test('Null start initializes one 6x6 run with six cells and free inventory; no ad',async()=>{
 const h=reactorHarness({available:false});assert.equal(h.controller.phase,'MENU');await h.flow.start();
 assert.equal(h.started,1);assert.equal(h.requests.length,0);assert.equal(h.rng,12);
 const s=h.controller.state;assert.equal(h.controller.phase,'PLAYING');assert.equal(s.board.length,36);assert.equal(s.board.filter(Boolean).length,6);
 for(const key of ['moves','heat','stability','score','coolUsed','upgradeUsed'])assert.equal(s[key],0);
 for(const key of ['coolCoreRemaining','upgradeRemaining','coolGranted','upgradeGranted'])assert.equal(s[key],1);
});
for(const outcome of ['completed','closed','failed','no_fill','timeout','unavailable','blocked']){
 test('startup priority and exactly one start after '+outcome,async()=>{
  const h=reactorHarness({startupDue:true,result:outcome,deferred:true});const a=h.flow.start();void h.flow.start();void h.flow.start();
  assert.equal(h.requests.length,1);assert.equal(h.requests[0].placementId,'reactor.startup');h.resolve();await a;
  assert.equal(h.started,1);assert.equal(h.rng,12);assert.equal(h.flow.locked,false);
 });
 test('Pause remains paused after '+outcome,async()=>{
  const h=reactorHarness({result:outcome});h.flow.freshRun();const id=h.flow.runId;h.flow.pause();await new Promise(r=>setImmediate(r));
  assert.equal(h.controller.phase,'PAUSED');assert.equal(h.requests.length,1);h.flow.pause();h.flow.resume();
  assert.equal(h.requests.length,1);assert.equal(h.controller.phase,'PLAYING');assert.equal(h.flow.runId,id);
 });
}
test('startup explicitly not-applicable may fall through; all other refusals cannot chain',async()=>{
 for(const reason of ['disabled','startup-once-per-session','placement-cap','provider-failed']){
  const h=reactorHarness({startupDue:true,result:'blocked',reason});await h.flow.start();
  assert.equal(h.requests.length,reason==='provider-failed'?1:2);
 }
});
for(const phase of ['MENU','RESULT','PAUSED'])test('unified deliberate start from '+phase,async()=>{
 const h=reactorHarness();h.controller.phase=phase;await h.flow.start();
 assert.equal(h.requests[0].placementId,'reactor.start-interstitial');assert.equal(h.requests[0].safeEvent,'start-requested');assert.equal(h.started,1);
});
test('Pause queued during resolving settles committed move once with no extra RNG',async()=>{
 const h=reactorHarness();h.flow.freshRun();h.controller.state.board.fill(0);h.controller.state.board[0]=h.controller.state.board[1]=1;
 assert.ok(h.controller.act(0,1));const snapshot=structuredClone(h.controller.state),rng=h.rng;
 h.flow.pause();h.flow.pause();assert.equal(h.flow.locked,true);assert.equal(h.requests.length,0);
 await h.flow.settledTurn();assert.equal(h.controller.phase,'RESOLVING');h.controller.finish();await h.flow.settledTurn();await h.flow.settledTurn();
 assert.equal(h.controller.phase,'PAUSED');assert.equal(h.requests.length,1);assert.equal(h.rng,rng);assert.deepEqual(h.controller.state,snapshot);assert.equal(snapshot.moves,1);
});
test('terminal committed turn cancels queued Pause; ordinary moves and internal pause never request ads',async()=>{
 const h=reactorHarness();h.flow.freshRun();h.controller.state.board.fill(0);h.controller.state.board[0]=1;h.controller.state.heat=99;
 h.controller.act(0,1);h.flow.pause();h.controller.finish();await h.flow.settledTurn();
 assert.equal(h.controller.phase,'RESULT');assert.equal(h.requests.length,0);assert.equal(h.flow.locked,false);
 h.flow.freshRun();h.controller.pause();h.flow.resume();assert.equal(h.requests.length,0);
});
for(const power of ['cool','upgrade']) {
 const key=power==='cool'?'coolCoreRemaining':'upgradeRemaining';
 test(power+' qualified refill changes only inventory and grants; no activation, one independent attempt',async()=>{
  const h=reactorHarness();h.flow.freshRun();h.controller.state[key]=0;const before=structuredClone(h.controller.state),rng=h.rng,id=h.flow.runId;
  await h.flow.refill(power);assert.equal(h.controller.state[key],1);assert.equal(h.acks.length,1);assert.equal(h.flow.attempts[power],true);
  before[key]++;before[power+'Granted']++;assert.deepEqual(h.controller.state,before);assert.equal(h.rng,rng);assert.equal(h.flow.runId,id);
  h.controller.state[key]=0;await h.flow.refill(power);assert.equal(h.requests.length,1);
  const other=power==='cool'?'upgrade':'cool';h.controller.state[other==='cool'?'coolCoreRemaining':'upgradeRemaining']=0;assert.equal(h.flow.canRefill(other),true);
 });
 for(const shown of [false,true])test(power+' failure/skip shown-attempt semantics '+shown,async()=>{
  const h=reactorHarness({result:'closed',qualified:false,shown});h.flow.freshRun();h.controller.state[key]=0;
  await h.flow.refill(power);assert.equal(h.controller.state[key],0);assert.equal(h.acks.length,0);assert.equal(h.flow.attempts[power],shown);assert.equal(h.flow.canRefill(power),!shown);
 });
 for(const patch of [{runId:'stale'}, {placementId:'reactor.wrong'}, {gameId:'orbit-break'}, {shown:false}, {rewardQualified:false}])test(power+' rejects invalid reward '+JSON.stringify(patch),async()=>{
  const h=reactorHarness({deferred:true});h.flow.freshRun();h.controller.state[key]=0;const pending=h.flow.refill(power);void h.flow.refill(power);
  assert.equal(h.requests.length,1);h.resolve(patch);await pending;assert.equal(h.controller.state[key],0);assert.equal(h.acks.length,0);
 });
}
test('actual power uses stay truthful after refill and receipt never counts as use',async()=>{
 const h=reactorHarness();h.flow.freshRun();h.controller.state.heat=40;h.controller.useCoolCore();
 assert.equal(h.controller.state.coolUsed,1);await h.flow.refill('cool');assert.equal(h.controller.state.coolGranted,2);assert.equal(h.controller.state.coolUsed,1);
 h.controller.useCoolCore();assert.equal(h.controller.state.coolUsed,2);assert.equal(h.controller.state.heat,0);
 const index=h.controller.state.board.findIndex(Boolean);h.controller.useUpgrade(index);await h.flow.refill('upgrade');h.controller.useUpgrade(index);
 assert.equal(h.controller.state.upgradeUsed,2);assert.equal(h.controller.state.upgradeGranted,2);
});
test('refill unavailable outside stable depleted live run; developer restart is ad-free',async()=>{
 const h=reactorHarness();h.flow.freshRun();assert.equal(h.requests.length,0);assert.equal(h.flow.canRefill('cool'),false);
 h.controller.state.coolCoreRemaining=0;
 for(const phase of ['MENU','RESULT','PAUSED','RESOLVING']){h.controller.phase=phase;await h.flow.refill('cool');assert.equal(h.requests.length,0);}
});
test('disposal invalidates delayed start and rewards',async()=>{
 for(const start of [true,false]){
  const h=reactorHarness({deferred:true});if(!start){h.flow.freshRun();h.controller.state.coolCoreRemaining=0;}
  const pending=start?h.flow.start():h.flow.refill('cool');const count=h.started;h.flow.destroy();h.resolve();await pending;
  assert.equal(h.started,count);assert.equal(h.acks.length,0);
 }
});
test('Reactor engineering placements preserve unlimited interstitials and separate one-run ceilings',()=>{
 assert.equal(REACTOR_PLACEMENTS.length,5);
 for(const p of REACTOR_PLACEMENTS){assert.equal(p.enabled,true);assert.equal(p.cooldownSeconds,0);if(p.adType==='interstitial')assert.equal(p.sessionLimitEnabled,false);if(p.adType==='rewarded')assert.equal(p.maxPerRun,1);}
 assert.deepEqual(REACTOR_PLACEMENTS.filter(p=>p.adType==='interstitial').map(p=>p.safeEvents),[['start-requested'],['pause-requested']]);
});
function serviceHarness() {
  let now=0;const calls=[];
  const provider={name:'MOCK',initialize:async()=>{},isReady:()=>true,prepareAd:async()=> 'ready',showAd:async(req,_signal,shown)=>{calls.push(req);shown();return 'completed';},showBanner:()=>false,hideBanner:()=>{},destroy:()=>{}};
  const service=new AdService(provider,{development:true,now:()=>now});registerGamePlacements(service);service.setContext(GAME_ID);
  const request=(placementId,values={})=>service.request({requestId:crypto.randomUUID(),gameId:GAME_ID,placementId,adType:REACTOR_PLACEMENTS.find(p=>p.id===placementId).adType,...values});
  return {service,calls,request,advance:ms=>{now+=ms;service.tick();}};
}
test('all five Reactor placements use website slug, exact semantic events and hard revive ceiling',()=>{
  const h=serviceHarness();assert.equal([...h.service.placements.values()].filter(p=>p.gameId===GAME_ID).length,5);assert.deepEqual(h.service.placements.get('reactor.start-interstitial').safeEvents,['start-requested']);
  assert.deepEqual(h.service.placements.get('reactor.pause-interstitial').safeEvents,['pause-requested']);
  h.service.tunePlacement('reactor.cool-refill',{maxPerRun:9});assert.equal(h.service.placements.get('reactor.cool-refill').maxPerRun,1);
});
test('timer eligibility never shows, non-playing time excluded, PLAY safe event required',async()=>{
  const h=serviceHarness();h.advance(200000);assert.equal(h.service.activeSeconds,0);h.service.setGameState('playing');h.advance(180000);
  assert.equal(h.calls.length,0);assert.equal(h.service.interstitialEligibility().eligible,true);
  assert.equal((await h.request('reactor.start-interstitial',{safeEvent:'run-ended'})).reason,'no-safe-event');
  assert.equal((await h.request('reactor.start-interstitial',{safeEvent:'start-requested'})).result,'completed');assert.equal(h.calls.length,1);
});
for(const reason of ['not-enough-active-play','cooldown','session-cap']) test(`PLAY cannot bypass website ${reason}`,async()=>{
  const h=serviceHarness();h.service.config.interstitial.firstSeconds=0;h.service.nextEligibleAt=reason==='not-enough-active-play'?180:0;
  if(reason==='cooldown')h.service.interstitialCooldownAt=0;
  if(reason==='session-cap'){h.service.config.interstitial.sessionLimitEnabled=true;h.service.interstitialCount=3;}
  assert.equal((await h.request('reactor.start-interstitial',{safeEvent:'start-requested'})).reason,reason);assert.equal(h.calls.length,0);
});
test('host shown-run cap survives stats reset and rejects missing run context',async()=>{
  const h=serviceHarness();assert.equal((await h.request('reactor.cool-refill',{userInitiated:true})).reason,'run-context-required');
  assert.equal((await h.request('reactor.cool-refill',{userInitiated:true,runId:'run-one'})).rewardQualified,true);h.service.clearStats();
  assert.equal((await h.request('reactor.cool-refill',{userInitiated:true,runId:'run-one'})).reason,'placement-run-cap');
  assert.equal((await h.request('reactor.cool-refill',{userInitiated:true,runId:'run-two'})).rewardQualified,true);
});
test('Null capabilities are honest; placement and global rewarded controls update availability',()=>{
  const n=new AdService(new NullAdAdapter());registerGamePlacements(n);assert.equal(n.capabilities(GAME_ID).fullscreenAvailable,false);assert.equal(n.capabilities(GAME_ID).rewardedAvailable,false);
  const h=serviceHarness();h.service.tunePlacement('reactor.cool-refill',{enabled:false});h.service.tunePlacement('reactor.upgrade-refill',{enabled:false});assert.equal(h.service.capabilities(GAME_ID).rewardedAvailable,false);
  h.service.tunePlacement('reactor.cool-refill',{enabled:true});assert.equal(h.service.capabilities(GAME_ID).rewardedAvailable,true);
  h.service.configure({...h.service.config,rewarded:{...h.service.config.rewarded,enabled:false}});assert.equal(h.service.capabilities(GAME_ID).rewardedAvailable,false);
});
test('real host bridge -> mock provider -> broker -> game client -> renderer completes and acknowledges once',async()=>{
  const time=fakeClock(), broker=new GamePresentationBroker(), child={},host={},wire=[],suspension=[];
  const service=new AdService(new MockAdAdapter(()=>service.config,()=>{},broker),{development:true});registerGamePlacements(service);service.setContext(GAME_ID);service.config.mock.loadingMs=0;
  const player=new GameAdPlayer({courtesy:()=>{},showing:()=>{},countdown:()=>{},clear:()=>{},destroy:()=>{}},time);
  let bridge;const client=new ReactorAdClient({origin:'https://local.test',source:host,time,send:m=>{wire.push(m);queueMicrotask(()=>bridge.receive({origin:'https://local.test',source:child,data:m}));},suspend:v=>suspension.push(v),changed:()=>{},present:(p,e)=>player.play(p,e),cancelPresentation:()=>player.cancel()});
  const send=m=>queueMicrotask(()=>client.receive({origin:'https://local.test',source:host,data:{...envelope,...m}}));
  broker.bind(GAME_ID,send);bridge=createAdBridge(service,{origin:'https://local.test',source:child,gameId:GAME_ID,send,presentation:broker});
  client.start();await new Promise(r=>setTimeout(r,0));assert.equal(client.connected,true);assert.equal(broker.rendererReady,true);
  const pending=client.request('rewarded','reactor.cool-refill',{userInitiated:true,runId:'live-run'});await new Promise(r=>setTimeout(r,10));
  assert.deepEqual(suspension,[true]);time.advance(6000);await new Promise(r=>setTimeout(r,0));
  const result=await pending;assert.equal(result.rewardQualified,true);assert.equal(result.shown,true);client.acknowledge(result);client.acknowledge(result);await new Promise(r=>setTimeout(r,0));
  assert.equal(service.rewardAcknowledgments,1);assert.equal(service.stats.rewarded.shown,1);assert.deepEqual(suspension,[true,false]);
  assert.equal(wire.filter(m=>m.type==='ad-presentation-completed').length,1);client.destroy();bridge.dispose();player.destroy();service.destroy();
});

test('stale, wrong-run and duplicate result cannot release or reward a newer request',async()=>{
  const h=clientHarness();const p=h.client.request('rewarded','reactor.cool-refill',{runId:'run-current',userInitiated:true});const requestId=h.sent.at(-1).requestId;
  const result={type:'ad-result',requestId,placementId:'reactor.cool-refill',adType:'rewarded',result:'completed',rewardQualified:true,runId:'run-wrong'};
  h.receive(result);assert.equal(h.client.busy,true);h.receive({...result,runId:'run-current',requestId:'stale'});assert.equal(h.client.busy,true);
  h.receive({...result,runId:'run-current'});assert.equal((await p).rewardQualified,false);h.receive({...result,runId:'run-current'});assert.equal(h.client.busy,false);
});
test('capability changes cannot be widened by generic DEV preview placements',()=>{
  const h=serviceHarness();h.service.register({id:`dev-${GAME_ID}-rewarded`,gameId:GAME_ID,adType:'rewarded',enabled:true,cooldownSeconds:0,maxPerSession:100});
  h.service.tunePlacement('reactor.cool-refill',{maxPerRun:0});h.service.tunePlacement('reactor.upgrade-refill',{maxPerRun:0});assert.equal(h.service.capabilities(GAME_ID).rewardedAvailable,false);
});
test('renderer failures emit one failure; cancellation removes countdown callbacks',()=>{
  const events=[],time=fakeClock();
  const player=new GameAdPlayer({courtesy:()=>{throw new Error('view unavailable');},showing:()=>{},countdown:()=>{},clear:()=>{},destroy:()=>{}},time);
  player.play(presentation,e=>events.push(e));time.advance(30000);assert.deepEqual(events,['ad-presentation-ready','ad-presentation-failed']);assert.equal(time.size,0);
});
test('production renderer absence does not falsely advertise presentation support',()=>{
  const sent=[];const client=new ReactorAdClient({origin:'https://local.test',source:{},send:m=>sent.push(m),suspend:()=>{},changed:()=>{},present:()=>false,cancelPresentation:()=>{},presentationReady:()=>false});
  client.start();assert.equal(sent[0].presentationVersion,undefined);client.destroy();
});
test('broker completion deadline includes the visual duration after readiness',async()=>{
  const broker=new GamePresentationBroker(),h=serviceHarness();broker.bind(GAME_ID,()=>{});broker.ready(GAME_ID,1);
  const config=h.service.config;config.mock.presentationTimeoutMs=15;config.mock.durationMs=50;config.courtesy.enabled=false;
  const identity={requestId:'deadline-test',gameId:GAME_ID,placementId:'reactor.cool-refill'};
  const result=broker.present({...identity,adType:'rewarded'},config,'completed',new AbortController().signal,()=>{});
  broker.receive({...identity,type:'ad-presentation-ready'});broker.receive({...identity,type:'ad-presentation-shown'});
  await new Promise(r=>setTimeout(r,30));assert.equal(broker.receive({...identity,type:'ad-presentation-completed'}),true);
  assert.equal((await result).result,'completed');broker.unbind(GAME_ID);
});
