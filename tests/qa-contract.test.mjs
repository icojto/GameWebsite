import test from 'node:test';
import assert from 'node:assert/strict';
import { heatPercent } from '../games/reactor-stack/src/hud.ts';
import { loadMute, saveMute, MUTE_KEY } from '../games/orbit-break/src/game/mute.ts';
import { scopedStorage } from '../shared/storage-scope.mjs';
import { TurnController, hasLegalAction } from '../games/reactor-stack/src/rules.ts';
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
