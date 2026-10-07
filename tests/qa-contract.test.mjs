import test from 'node:test';
import assert from 'node:assert/strict';
import { heatPercent } from '../games/reactor-stack/src/hud.ts';
import { loadMute, saveMute, MUTE_KEY } from '../games/orbit-break/src/game/mute.ts';
import { scopedStorage } from '../shared/storage-scope.mjs';
import { TurnController, hasLegalAction } from '../games/reactor-stack/src/rules.ts';
import { applyFixture } from '../games/reactor-stack/src/dev-fixtures.ts';
import { seededRandom } from '../shared/seeded-random.mjs';
import { OrbitAudio } from '../games/orbit-break/src/game/audio.ts';
import { DEFAULT_CONFIG } from '../games/orbit-break/src/game/config.ts';
import { ProfileStore, PROFILE_KEY, LEGACY_BEST_KEY } from '../games/orbit-break/src/game/profile.ts';
function store(){const data=new Map();return {get length(){return data.size},key:i=>[...data.keys()][i],getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};}
test('heat text/bar normalization includes tuned capacity and invalid input',()=>{
 for(const [heat,max,expected] of [[25,50,50],[50,50,100],[4,4,100],[200,100,100],[-3,100,0],[NaN,50,0],[25,0,25]])assert.equal(heatPercent(heat,max),expected);
});
test('normal fresh initialization is playable and terminal re-evaluation is once',()=>{
 const c=new TurnController(()=>.1);c.start();assert.equal(c.state.board.filter(Boolean).length,6);assert.equal(c.state.board.length,36);assert.ok(hasLegalAction(c.state.board));assert.equal(c.phase,'PLAYING');assert.equal(c.state.moves+c.state.heat+c.state.score+c.state.stability,0);
 c.state.stability=c.activeConfig.stabilityTarget;assert.equal(c.reEvaluate(),'WIN');assert.equal(c.phase,'RESULT');assert.equal(c.act(0,1),null);
});
test('explicit mute reload, corruption and denied storage',()=>{
 const s=store();assert.equal(loadMute(s),false);saveMute(s,true);assert.equal(loadMute(s),true);s.setItem(MUTE_KEY,'{"version":1,"mute":"true"}');assert.equal(loadMute(s),false);s.setItem(MUTE_KEY,'broken');assert.equal(loadMute(s),false);
 const denied={getItem(){throw Error('denied')},setItem(){throw Error('denied')}};assert.equal(loadMute(denied),false);saveMute(denied,true);
});
test('QA resets, legacy/corrupt entries and reload preserve real and other session sentinels',()=>{
 const real=store();real.setItem('orbitBreak.profile.v2','real sentinel');const a=scopedStorage(()=>real,'session_A');const reload=scopedStorage(()=>real,'session_A');const b=scopedStorage(()=>real,'session_B');
 a.setItem('orbitBreak.bestScore','420');a.setItem('orbitBreak.profile.v2','corrupt');saveMute(a,true);assert.equal(loadMute(reload),true);assert.equal(b.getItem(MUTE_KEY),null);b.setItem('orbitBreak.bestScore','99');a.resetSession();assert.equal(real.getItem('orbitBreak.profile.v2'),'real sentinel');assert.equal(b.getItem('orbitBreak.bestScore'),'99');assert.equal(reload.getItem('orbitBreak.bestScore'),null);
});
test('failed QA storage uses namespaced memory without real fallback',()=>{
 const a=scopedStorage(()=>{throw Error('denied')},'session_A');a.setItem('key','memory');assert.equal(a.getItem('key'),'memory');a.removeItem('key');assert.equal(a.getItem('key'),null);assert.throws(()=>scopedStorage(()=>store(),'../unsafe'));
});
test('actual named fixtures initialize fresh state and finalize one active run without advertising',()=>{
 const controller=new TurnController(seededRandom(41));let starts=0,results=0,runId=0;
 const api={controller,locked:()=>false,startRun(){starts++;runId++;controller.start()},finalize(){results++}};
 assert.ok(applyFixture(api,'Fresh Run',true));assert.equal(starts,1);assert.equal(controller.state.board.filter(Boolean).length,6);assert.ok(hasLegalAction(controller.state.board));const id=runId;
 assert.ok(applyFixture(api,'Force Win',true));assert.equal(controller.phase,'RESULT');assert.equal(results,1);assert.equal(runId,id);
 assert.equal(applyFixture(api,'Force Fail',true),false);assert.equal(results,1);assert.equal(starts,1);
 applyFixture(api,'Fresh Run',true);assert.ok(applyFixture(api,'Force Fail',true));assert.equal(controller.phase,'RESULT');assert.equal(controller.state.result,'FAIL');assert.equal(results,2);
 applyFixture(api,'Fresh Run',true);assert.equal(applyFixture(api,'Force Win',false),false);
});
test('fixture setup respects transition lock and real resolving callbacks',()=>{
 const controller=new TurnController(seededRandom(41));let locked=true,starts=0;
 const api={controller,locked:()=>locked,startRun(){starts++;controller.start()},finalize(){}};
 assert.equal(applyFixture(api,'Fresh Run',true),false);assert.equal(starts,0);locked=false;
 applyFixture(api,'Resolving Move Setup',true);assert.equal(controller.phase,'PLAYING');const turn=controller.act(0,1);assert.ok(turn);assert.equal(controller.phase,'RESOLVING');locked=true;assert.equal(applyFixture(api,'Force Win',true),false);controller.finish();assert.equal(controller.phase,'PLAYING');
 locked=false;applyFixture(api,'Powers Depleted',true);assert.equal(controller.state.coolUsed+controller.state.upgradeUsed,0);assert.equal(controller.state.coolCoreRemaining+controller.state.upgradeRemaining,0);
});
test('QA seeded stream is reproducible without changing production randomness',()=>{
 const a=seededRandom(41),b=seededRandom(41);for(let i=0;i<100;i++)assert.equal(a(),b());assert.equal(typeof Math.random,'function');
});
test('actual audio ad suspension never writes the saved user mute preference',()=>{
 const previous=globalThis.localStorage;const s=store();globalThis.localStorage=s;
 try { const audio=new OrbitAudio(DEFAULT_CONFIG);audio.setMuted(true);const saved=s.getItem(MUTE_KEY);audio.suspendForAd(true);audio.suspendForAd(false);assert.equal(s.getItem(MUTE_KEY),saved);assert.equal(new OrbitAudio(DEFAULT_CONFIG).settings.mute,true);assert.equal(audio.effectiveSuspension,false);audio.setMuted(false);audio.suspendForAd(true);assert.equal(loadMute(s),false);assert.equal(audio.effectiveSuspension,true); }
 finally {if(previous===undefined)delete globalThis.localStorage;else globalThis.localStorage=previous;}
});
test('actual profile migration, corruption, reset and reload through QA adapter preserve real profile sentinel',()=>{
 const real=store();real.setItem(PROFILE_KEY,'real profile sentinel');real.setItem(LEGACY_BEST_KEY,'9999');const qa=scopedStorage(()=>real,'session_A');qa.setItem(LEGACY_BEST_KEY,'420');qa.setItem(PROFILE_KEY,'{invalid');saveMute(qa,true);
 const profile=new ProfileStore(structuredClone(DEFAULT_CONFIG),qa);assert.equal(profile.bestScore,420);profile.setStars(100);profile.reset();assert.equal(profile.bestScore,420);assert.equal(loadMute(qa),true);
 const reloaded=new ProfileStore(structuredClone(DEFAULT_CONFIG),scopedStorage(()=>real,'session_A'));assert.equal(reloaded.bestScore,420);assert.equal(real.getItem(PROFILE_KEY),'real profile sentinel');assert.equal(real.getItem(LEGACY_BEST_KEY),'9999');qa.resetSession();assert.equal(real.getItem(PROFILE_KEY),'real profile sentinel');
});


import { MenuPresentation, INITIAL_MENU } from '../games/reactor-stack/src/menu-presentation.ts';
import { ReactorAdFlow } from '../games/reactor-stack/src/ads/ReactorAdFlow.ts';
import { playableViewport } from '../shared/game-viewport.ts';
test('FAI-001 Force Fail → Reinitialize → Pause → Main Menu clears stale UI and invalidates late result',async()=>{
 const controller=new TurnController(()=>.1),ui=new MenuPresentation();let view={...INITIAL_MENU},completed=[];
 const ads={capabilities:{fullscreenAvailable:false,rewardedAvailable:false,startupDue:false},request(){assert.fail('Null lifecycle should not request')},acknowledge(){}};
 const flow=new ReactorAdFlow(controller,ads,{start(){ui.reset(v=>view=v);controller.start()},changed(){},cancelGesture(){},feedback(){}});
 flow.freshRun();controller.state.heat=controller.activeConfig.heatMaximum;controller.reEvaluate();completed.push({...controller.state});
 const terminalState=controller.state;const late=ui.guard(()=>controller.phase==='RESULT'&&controller.state===terminalState,()=>view={...INITIAL_MENU,title:'CORE OVERLOAD',start:'REINITIALIZE REACTOR',failed:true});
 late();assert.equal(view.failed,true);await flow.start();const freshId=flow.runId;assert.ok(freshId);assert.equal(controller.state.heat,0);flow.pause();await new Promise(r=>setImmediate(r));assert.equal(controller.phase,'PAUSED');assert.equal(flow.menu(),true);ui.reset(v=>view=v);late();
 assert.deepEqual(view,INITIAL_MENU);assert.equal(controller.phase,'MENU');assert.equal(flow.runId,'');assert.equal(completed.length,1);assert.equal(completed[0].result,'FAIL');
});
test('terminal guard cannot render after phase change even before UI invalidation',()=>{
 const ui=new MenuPresentation();let phase='RESULT',renders=0;const late=ui.guard(()=>phase==='RESULT',()=>renders++);phase='MENU';late();assert.equal(renders,0);
});
test('declared minimum provides a graceful fallback instead of accepting a clipped frame',()=>{
 assert.equal(playableViewport(240,280),true);assert.equal(playableViewport(239,280),false);assert.equal(playableViewport(240,279),false);
 for(const size of [[320,800],[640,360],[844,390],[1920,1080]])assert.equal(playableViewport(...size),true);
});
