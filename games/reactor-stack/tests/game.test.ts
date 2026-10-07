import { test } from 'node:test';
import assert from 'node:assert/strict';
import { copyConfig, DEFAULT_CONFIG } from '../src/config.ts';
import { cellCount, coolCore, emptyState, evaluate, hasLegalAction, initialState, legal, resolve, spawn, TurnController, upgrade } from '../src/rules.ts';
import { Gesture, cellAt } from '../src/input.ts';
import { clearReactorStorage, orderScores, readBest, readScores, recordScore } from '../src/storage.ts';
import { layoutMode } from '../src/layout.ts';

const cfg = () => copyConfig();
test('production geometry is a deterministic 6 × 6 board',()=>{const c=cfg(),state=emptyState(c);assert.equal(c.gridWidth,6);assert.equal(c.gridHeight,6);assert.equal(cellCount(c),36);assert.equal(state.board.length,36);const first=initialState(c,()=>0);assert.equal(first.board.filter(Boolean).length,6);assert.deepEqual(first,initialState(c,()=>0));});
test('menu start initializes one clean 6 × 6 PLAYING run',()=>{const controller=new TurnController(()=>0);controller.setMenu();assert.equal(controller.phase,'MENU');controller.start();assert.equal(controller.phase,'PLAYING');assert.equal(controller.state.board.length,36);assert.equal(controller.state.board.filter(Boolean).length,6);assert.equal(controller.state.moves,0);assert.equal(controller.state.heat,0);assert.equal(controller.state.stability,0);assert.equal(controller.state.coolCoreRemaining,1);assert.equal(controller.state.upgradeRemaining,1);});
test('coordinates and weighted spawn stay in configured bounds',()=>{const c=cfg();assert.equal(cellAt(479,479,0,0,80,c),35);assert.equal(cellAt(480,0,0,0,80,c),null);assert.equal(cellAt(-1,0,0,0,80,c),null);const state=emptyState(c);state.board.fill(1);state.board[16]=0;const turn=resolve({...state,board:[...state.board]},17,16,c,()=>.99)!;assert.equal(turn.spawned,17);assert.equal(turn.spawnTier,2);});
test('full board cannot spawn and no full-board action is invented',()=>{const state=emptyState(cfg());state.board.fill(1);assert.equal(spawn(state.board,()=>0),null);});
test('empty orthogonal move increments Moves exactly once and spawns',()=>{const c=cfg(),state=emptyState(c);state.board[0]=1;const turn=resolve(state,0,1,c,()=>0)!;assert.equal(state.board[0],1);assert.equal(turn.next.board[1],1);assert.equal(turn.next.moves,1);assert.equal(turn.next.heat,4);assert.equal(turn.next.board.filter(Boolean).length,2);});
test('invalid neighbor, unequal merge, and diagonal action are free',()=>{const c=cfg(),state=emptyState(c);state.board[0]=1;state.board[1]=2;assert.equal(resolve(state,0,1,c),null);assert.equal(resolve(state,0,7,c),null);assert.equal(resolve(state,0,12,c),null);assert.equal(state.moves,0);assert.equal(state.heat,0);});
test('same tiers merge with preserved rewards and Tier V does not merge',()=>{const c=cfg();for(let tier=1;tier<5;tier++){const state=emptyState(c);state.board[0]=state.board[1]=tier;state.heat=10;const turn=resolve(state,0,1,c,()=>.1)!;assert.equal(turn.next.board[1],tier+1);assert.equal(turn.next.moves,1);assert.equal(turn.next.heat,10+c.baseTurnHeat-c.mergeHeatReductionByTier[tier+1]);assert.equal(turn.next.stability,c.stabilityRewardByTier[tier+1]);assert.equal(turn.next.score,c.scoreRewardByTier[tier+1]);}const tierFive=emptyState(c);tierFive.board[0]=tierFive.board[1]=5;assert.equal(legal(tierFive.board,0,1,c),false);assert.equal(legal(tierFive.board,0,6,c),true);});
test('win has precedence over same-turn heat failure and avoids spawning',()=>{const c=cfg(),state=emptyState(c);state.board[0]=state.board[1]=4;state.stability=76;state.heat=99;const turn=resolve(state,0,1,c,()=>0)!;assert.equal(turn.next.result,'WIN');assert.equal(turn.spawned,null);assert.equal(turn.next.moves,1);});
test('heat and deadlock failures resolve with no legal action',()=>{const c=cfg(),overheat=emptyState(c);overheat.board[0]=1;overheat.heat=96;assert.equal(resolve(overheat,0,1,c,()=>0)!.next.result,'FAIL');const dead=emptyState(c);dead.board=dead.board.map((_,i)=>(i%6+Math.floor(i/6))%2+1);assert.equal(hasLegalAction(dead.board,c),false);evaluate(dead,c);assert.equal(dead.result,'FAIL');});
test('Cool Core uses one charge, clamps heat and leaves other systems unchanged',()=>{const c=cfg(),state=emptyState(c);state.heat=20;state.score=33;state.stability=12;state.moves=8;const cooled=coolCore(state,c)!;assert.equal(cooled.heat,0);assert.equal(cooled.coolCoreRemaining,0);assert.equal(cooled.moves,8);assert.equal(cooled.score,33);assert.equal(cooled.stability,12);assert.deepEqual(cooled.board,state.board);assert.equal(coolCore(cooled,c),null);});
test('Upgrade advances Tier I–IV only, consumes only valid target and has no turn rewards',()=>{const c=cfg();for(let tier=1;tier<=4;tier++){const state=emptyState(c);state.board[2]=tier;state.heat=31;state.moves=5;const next=upgrade(state,2,c)!;assert.equal(next.board[2],tier+1);assert.equal(next.upgradeRemaining,0);assert.equal(next.heat,31);assert.equal(next.moves,5);assert.equal(next.score,0);assert.equal(next.stability,0);}const max=emptyState(c);max.board[2]=5;assert.equal(upgrade(max,2,c),null);assert.equal(max.upgradeRemaining,1);});
test('controller locks input while resolving and pauses without losing board state',()=>{const controller=new TurnController(()=>0);controller.start();controller.state.board.fill(0);controller.state.board[0]=1;const turn=controller.act(0,1)!;assert.equal(controller.phase,'RESOLVING');assert.equal(controller.act(1,2),null);controller.finish();const before=JSON.stringify(controller.state);controller.pause();assert.equal(controller.phase,'PAUSED');controller.resume();assert.equal(JSON.stringify(controller.state),before);assert.ok(turn);});
test('tap and drag share selection rules',()=>{const gesture=new Gesture();gesture.begin(0,1);assert.equal(gesture.end(0,1),null);gesture.begin(1,1);assert.deepEqual(gesture.end(1,1),[0,1]);gesture.begin(2,1);assert.equal(gesture.end(3,2),null);assert.deepEqual(gesture.end(3,1),[2,3]);gesture.begin(2,1);gesture.reset();assert.equal(gesture.end(3,1),null);});
test('Top 10 score storage orders score then fewer moves, persists outcomes and survives malformed data',()=>{let data=new Map<string,string>([['reactor-stack-best','42']]);const store={getItem:(key:string)=>data.get(key)??null,setItem:(key:string,value:string)=>data.set(key,value),removeItem:(key:string)=>data.delete(key)};assert.equal(readBest(store),42);for(let i=0;i<12;i++)recordScore({score:i===11?100:50,moves:20-i,result:i%2?'FAIL':'WIN'},store,100+i);const scores=readScores(store);assert.equal(scores.length,10);assert.equal(scores[0].score,100);const tied=orderScores([{score:50,moves:12,result:'WIN',timestamp:3},{score:50,moves:8,result:'FAIL',timestamp:4}]);assert.equal(tied[0].moves,8);data.set('reactor-stack-scores','not json');assert.deepEqual(readScores(store),[]);clearReactorStorage(store);assert.equal(readBest(store),0);});
test('layout calculations are presentation-only and never mutate an active game state',()=>{assert.equal(layoutMode(1920,1080),'wide');assert.equal(layoutMode(390,844),'portrait');assert.equal(layoutMode(844,390),'compact-landscape');assert.equal(layoutMode(200,220),'constrained');const controller=new TurnController(()=>0);controller.start();const before=JSON.stringify(controller.state);for(const size of [[1920,1080],[390,844],[844,390],[320,568],[1600,900]])layoutMode(...size);assert.equal(JSON.stringify(controller.state),before);});


import { bindBoardPointer, canvasPoint } from '../src/board-pointer.ts';
class PointerCanvas extends EventTarget {
  ownerDocument={defaultView:new EventTarget()}; captured=new Set<number>();failCapture=false;
  setPointerCapture(id:number){if(this.failCapture)throw Error('capture denied');this.captured.add(id);}
  hasPointerCapture(id:number){return this.captured.has(id);}
  releasePointerCapture(id:number){this.captured.delete(id);this.send('lostpointercapture',id);}
  send(type:string,id=1,x=10,y=10,button=0,pointerType='mouse'){const event=new Event(type,{cancelable:true});Object.assign(event,{pointerId:id,clientX:x,clientY:y,button,pointerType});(type==='pointermove'||type==='pointerup'||type==='pointercancel'?this.ownerDocument.defaultView:this).dispatchEvent(event);return event;}
}
function pointerBoard(){
  const canvas=new PointerCanvas(),controller=new TurnController(()=>0),gesture=new Gesture();controller.start();controller.state.board.fill(0);controller.state.board[0]=1;
  let enabled=true,accepted=0;const at=(x:number,y:number)=>cellAt(x,y,0,0,20);
  const input=bindBoardPointer(canvas as unknown as HTMLElement,{enabled:()=>enabled && controller.phase==='PLAYING',begin:(x,y,id)=>gesture.begin(at(x,y),id),release:(x,y,id)=>{const action=gesture.end(at(x,y),id);if(action&&controller.act(...action))accepted++;},cancel:()=>gesture.reset()});
  return {canvas,controller,gesture,input,disable(){enabled=false},get accepted(){return accepted}};
}
test('captured touch/pen/mouse drag releases one valid move and ignores duplicate up',()=>{
 const h=pointerBoard();assert.equal(h.canvas.send('pointerdown').defaultPrevented,true);assert.equal(h.canvas.hasPointerCapture(1),true);
 h.canvas.send('pointermove',1,30,10);h.canvas.send('pointerup',1,30,10);h.canvas.send('pointerup',1,30,10);
 assert.equal(h.accepted,1);assert.equal(h.controller.state.moves,1);assert.equal(h.controller.phase,'RESOLVING');assert.equal(h.canvas.captured.size,0);h.input.destroy();
});
test('Android touch button=-1 with denied capture still releases one board action',()=>{
 const h=pointerBoard();h.canvas.failCapture=true;
 assert.equal(h.canvas.send('pointerdown',7,10,10,-1,'touch').defaultPrevented,true);
 assert.equal(h.canvas.send('pointermove',7,30,10,-1,'touch').defaultPrevented,true);
 h.canvas.send('pointerup',7,30,10,-1,'touch');h.canvas.send('pointerup',7,30,10,-1,'touch');
 assert.equal(h.accepted,1);assert.equal(h.controller.state.moves,1);assert.equal(h.gesture.pointer,null);h.input.destroy();
});
test('tap source/destination remains one accepted move; invalid diagonal drag is free',()=>{
 const h=pointerBoard();h.canvas.send('pointerdown');h.canvas.send('pointerup');assert.equal(h.gesture.selected,0);
 h.canvas.send('pointerdown',1,30,10);h.canvas.send('pointerup',1,30,10);assert.equal(h.accepted,1);h.input.destroy();
 const invalid=pointerBoard();const before=JSON.stringify(invalid.controller.state);invalid.canvas.send('pointerdown');invalid.canvas.send('pointermove',1,30,30);invalid.canvas.send('pointerup',1,30,30);assert.equal(invalid.accepted,0);assert.equal(JSON.stringify(invalid.controller.state),before);invalid.input.destroy();
});
test('cancel, capture loss, blur and disabled release cannot commit or leave selection',()=>{
 for(const event of ['pointercancel','lostpointercapture','blur','disabled']){
  const h=pointerBoard();h.canvas.send('pointerdown');
  if(event==='blur')h.canvas.ownerDocument.defaultView.dispatchEvent(new Event('blur'));else if(event==='disabled')h.disable();else h.canvas.send(event);
  h.canvas.send('pointerup',1,30,10);assert.equal(h.accepted,0,event);assert.equal(h.gesture.pointer,null);assert.equal(h.gesture.selected,null);assert.equal(h.canvas.captured.size,0);h.input.destroy();
 }
});
test('foreign pointers/right mouse/capture fallback cannot hijack a board stroke',()=>{
 const h=pointerBoard();h.canvas.send('pointerdown');h.canvas.send('pointerdown',2,30,10);h.canvas.send('pointerup',2,30,10);assert.equal(h.accepted,0);assert.equal(h.gesture.pointer,1);h.canvas.send('pointerup',1,30,10);assert.equal(h.accepted,1);h.input.destroy();
 const other=pointerBoard();other.canvas.send('pointerdown',1,10,10,2);assert.equal(other.canvas.captured.size,0);other.canvas.failCapture=true;other.canvas.send('pointerdown');other.canvas.send('pointerup',1,30,10);assert.equal(other.accepted,1);assert.equal(other.gesture.pointer,null);other.input.destroy();
});
test('pointer coordinates use current CSS rectangle after resize without board-state mutation',()=>{
 const h=pointerBoard(),before=JSON.stringify(h.controller.state);
 assert.deepEqual(canvasPoint(35,70,{left:10,top:20,width:100,height:200},600,600),{x:150,y:150});
 assert.deepEqual(canvasPoint(160,170,{left:10,top:20,width:600,height:600},600,600),{x:150,y:150});
 assert.equal(JSON.stringify(h.controller.state),before);h.input.destroy();
});
