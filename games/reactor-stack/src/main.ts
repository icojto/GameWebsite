import Phaser from 'phaser';
import { gameRandom } from '../../../shared/storage.mjs';
import { heatPercent } from './hud.ts';
import { bindBoardPointer, canvasPoint } from './board-pointer.ts';
import { MenuPresentation } from './menu-presentation.ts';
import { mountViewportFallback } from '../../../shared/game-viewport.ts';
import '../../../shared/game-viewport.css';
import { connectReactorAds } from './ads/integration.ts';
import './style.css';
import { ReactorAudio } from './audio.ts';
import { DEFAULT_CONFIG, clampConfig, copyConfig } from './config.ts';
import { Gesture, cellAt } from './input.ts';
import { layoutMode } from './layout.ts';
import { TurnController, legalDestinations, type State } from './rules.ts';
import { readBest, readScores, recordScore } from './storage.ts';

document.querySelector('#app')!.innerHTML = `
<div class="game-shell" id="game-shell" data-layout="portrait">
  <aside class="control-panel" aria-label="Reactor controls">
    <div class="brand"><span class="brand-mark">◉</span><h1>REACTOR STACK</h1></div>
    <section class="goal"><span class="kicker">STABILIZE THE CORE</span><div class="core-dial"><span id="stability">0</span></div><strong id="stability-label">0 / 100</strong></section>
    <section class="move-readout"><span class="kicker">MOVES</span><strong id="moves">0</strong></section>
    <button class="control-button pause-button" id="pause">Ⅱ <span>PAUSE</span></button>
    <section class="power-section"><span class="kicker">POWER UPS</span><div class="powers"><button class="power" id="cool"><b>❄</b><span data-power-label>COOL CORE</span><em id="cool-count">1</em></button><button class="power" id="upgrade"><b>⇧</b><span data-power-label>UPGRADE</span><em id="upgrade-count">1</em></button></div></section>
    <button class="high-score" id="scores"><span>HIGH SCORE</span><strong id="best">0</strong><b>›</b></button>
  </aside>
  <main class="board-area"><div class="board-header"><span id="mode-label">CONTAINMENT GRID</span><span id="hint" aria-live="polite">Select a cell, then a neighbor.</span></div><div class="board-holder"><div id="board" aria-label="Six column, six row reactor board"></div></div><div class="heat"><span id="heat-label">CORE HEAT</span><div class="heat-track"><i id="heat-bar"></i></div><strong id="heat">0%</strong></div></main>
  <section class="portrait-bar"><button id="portrait-pause">PAUSE</button><button id="portrait-cool"><span data-power-label>COOL CORE</span> <span id="portrait-cool-count">1</span></button><button id="portrait-upgrade"><span data-power-label>UPGRADE</span> <span id="portrait-upgrade-count">1</span></button><button id="portrait-scores">SCORES</button></section>
</div>
<section class="overlay" id="menu-overlay"><div class="dialog menu-dialog"><div class="reactor-icon">◉</div><span class="kicker" id="menu-kicker">CONTAINMENT PROTOCOL / 002</span><h2 id="menu-title">REACTOR STACK</h2><p id="menu-copy">Move cells into adjacent empty slots or merge equal reactor cells. Build stability before heat reaches critical.</p><button class="primary" id="start">INITIALIZE REACTOR</button><small>Tap or drag into a neighboring slot. Tier V moves, but cannot merge.</small></div></section>
<section class="overlay" id="pause-overlay" hidden><div class="dialog"><span class="kicker">INTERFACE PAUSED</span><h2>PAUSED</h2><button class="primary" id="resume">RESUME</button><button class="dialog-button" id="sound">SOUND ON</button><button class="dialog-button" id="restart">RESTART RUN</button><button class="dialog-button" id="main-menu">MAIN MENU</button></div></section>
<section class="overlay" id="scores-overlay" hidden><div class="dialog scores-dialog"><span class="kicker">PERSISTENT LOCAL DATA</span><h2>LOCAL SCORES</h2><ol id="score-list"></ol><button class="dialog-button" id="close-scores">CLOSE</button></div></section>`;

const el = (id: string) => document.getElementById(id)!;
for(const id of ['pause','cool','upgrade','portrait-pause','portrait-cool','portrait-upgrade'])el(id).dataset.testid='reactor-'+id;
const audio = new ReactorAudio();
const controller = new TurnController(gameRandom, copyConfig());
let best = readBest(), upgradeArmed = false, runStartedAt = 0, completedRecorded = false;
type SessionEntry = { result: string; reason: string; score: number; moves: number; duration: number; peakHeat: number; stability: number; merges: number[]; coolUsed: number; upgradeUsed: number; coolGranted: number; upgradeGranted: number };
const sessionLog: SessionEntry[] = [];
let ads: ReturnType<typeof connectReactorAds> | undefined;
const REACTOR_SCENE_KEY = 'ReactorScene';
const menuPresentation = new MenuPresentation();
const updateViewportFallback = mountViewportFallback(el('app'));
let viewportSupported = true;

class ReactorScene extends Phaser.Scene {
  cells = new Map<number, Phaser.GameObjects.Container>(); grid!: Phaser.GameObjects.Graphics; selection!: Phaser.GameObjects.Graphics; geometry = { size: 1, left: 0, top: 0 }; gesture = new Gesture(); effects = 0; debug = { indices: false, legal: false, selection: true, geometry: false, bounds: false }; debugNodes: Phaser.GameObjects.Text[] = [];
  private boardPointer?: ReturnType<typeof bindBoardPointer>;
  constructor() { super(REACTOR_SCENE_KEY); }
  create() {
    this.grid = this.add.graphics(); this.selection = this.add.graphics().setDepth(10);
    this.scale.on('resize', () => { this.layoutBoard(); if(controller.phase!=='RESOLVING')this.render(); this.highlight(); });
    const point = (x: number, y: number, id: number) => ({ ...canvasPoint(x, y, this.game.canvas.getBoundingClientRect(), this.scale.width, this.scale.height), id });
    this.boardPointer = bindBoardPointer(this.game.canvas, {
      enabled: () => viewportSupported && controller.phase === 'PLAYING' && !ads?.flow.locked && !document.querySelector('.overlay:not([hidden]),dialog[open]'),
      begin: (x, y, id) => this.gesture.begin(this.hit(point(x, y, id)), id),
      release: (x, y, id) => this.release(point(x, y, id)),
      cancel: () => this.clearGesture(),
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.boardPointer?.destroy());
    this.layoutBoard(); controller.setMenu(); this.render(); this.hud();
  }
  layoutBoard() { const cfg = controller.activeConfig; const padding = Math.max(5, Math.min(this.scale.width, this.scale.height) * .018); const size = Math.max(1, Math.min((this.scale.width - padding * 2) / cfg.gridWidth, (this.scale.height - padding * 2) / cfg.gridHeight)); this.geometry = { size, left: (this.scale.width - size * cfg.gridWidth) / 2, top: (this.scale.height - size * cfg.gridHeight) / 2 }; this.grid.clear(); this.debugNodes.forEach(node=>node.destroy()); this.debugNodes=[]; for (let index = 0; index < cfg.gridWidth * cfg.gridHeight; index++) { const p = this.position(index); const half = size * .455; this.grid.fillStyle(0x122432); this.grid.fillRoundedRect(p.x-half, p.y-half, half*2, half*2, Math.max(4, size*.09)); this.grid.lineStyle(Math.max(1, size*.015), 0x294756); this.grid.strokeRoundedRect(p.x-half,p.y-half,half*2,half*2,Math.max(4,size*.09)); if(this.debug.indices)this.debugNodes.push(this.add.text(p.x-half+3,p.y-half+2,String(index),{fontFamily:'Arial',fontSize:`${Math.max(8,size*.13)}px`,color:'#7eeef2'}).setDepth(20)); } if(this.debug.geometry){this.grid.lineStyle(2,0xffd166);this.grid.strokeRect(this.geometry.left,this.geometry.top,size*cfg.gridWidth,size*cfg.gridHeight);} if(this.debug.bounds){this.grid.lineStyle(2,0xf37bd7);this.grid.strokeRect(0,0,this.scale.width,this.scale.height);} }
  position(index: number) { const cfg = controller.activeConfig; return { x: this.geometry.left + (index % cfg.gridWidth + .5) * this.geometry.size, y: this.geometry.top + (Math.floor(index / cfg.gridWidth) + .5) * this.geometry.size }; }
  hit(pointer: { x: number; y: number }) { return cellAt(pointer.x, pointer.y, this.geometry.left, this.geometry.top, this.geometry.size, controller.activeConfig); }
  startRun() { this.clean(); resetMenuPresentation(); controller.start(); runStartedAt = performance.now(); completedRecorded = false; upgradeArmed = false; el('menu-overlay').classList.remove('failed'); el('menu-overlay').hidden = true; el('scores-overlay').hidden=true; el('pause-overlay').hidden=true; this.layoutBoard(); this.render(); this.hud(); this.message('Select a cell, then a neighbor.'); }
  clean() { menuPresentation.invalidate(); this.boardPointer?.cancel(); this.tweens.killAll(); this.time.removeAllEvents(); this.clearGesture(); this.cameras.main.resetFX(); this.children.list.filter(item => item.getData('effect')).forEach(item => item.destroy()); this.effects = 0; }
  clearGesture() { this.gesture.reset(); this.selection?.clear(); }
  render() { this.cells.forEach(cell => cell.destroy()); this.cells.clear(); controller.state.board.forEach((tier, index) => { if (tier) this.cell(index, tier); }); }
  cell(index: number, tier: number) { const { x, y } = this.position(index), size = this.geometry.size, color = controller.activeConfig.tierDefinitions[tier - 1].color, node = this.add.container(x, y), graphics = this.add.graphics(); const r = size * .29; graphics.fillStyle(color, .07); graphics.fillCircle(0, 0, r * 1.25); graphics.lineStyle(Math.max(1.2, size*.025), color, .92); const octagon = (radius: number, rotation = Math.PI / 8) => { const points = Array.from({length:8}, (_, i) => new Phaser.Math.Vector2(Math.cos(i*Math.PI/4+rotation)*radius, Math.sin(i*Math.PI/4+rotation)*radius)); graphics.strokePoints(points, true); };
    octagon(r); if (tier >= 2) octagon(r*.72); if (tier >= 3) { graphics.strokeCircle(0,0,r*.45); octagon(r*.28,0); } if (tier >= 4) { octagon(r*.9,0); graphics.lineBetween(-r*.62,0,r*.62,0); graphics.lineBetween(0,-r*.62,0,r*.62); } if (tier === 5) { graphics.lineStyle(Math.max(2, size*.04), color, .9); graphics.strokeCircle(0,0,r*.2); graphics.lineStyle(Math.max(1.2,size*.025),color,.92); octagon(r*.52,0); octagon(r*.38,Math.PI/8); } graphics.fillStyle(color); graphics.fillCircle(0,0,tier === 5 ? r*.22 : r*.13); const label = this.add.text(0,r*1.38,controller.activeConfig.tierDefinitions[tier-1].short,{fontFamily:'Arial',fontSize:`${Math.max(9,size*.15)}px`,color:'#dffcff'}).setOrigin(.5); node.add([graphics,label]); this.cells.set(index,node); return node; }
  highlight() { this.selection.clear(); const index = this.gesture.selected; if (index === null || !controller.state.board[index]) return; const p = this.position(index), half = this.geometry.size*.455; if(this.debug.selection){this.selection.lineStyle(Math.max(1.5,this.geometry.size*.03),0xd0fbff);this.selection.strokeRoundedRect(p.x-half,p.y-half,half*2,half*2,Math.max(4,this.geometry.size*.09));} if(this.debug.legal){this.selection.lineStyle(Math.max(1,this.geometry.size*.02),0x9df6a9);for(const destination of legalDestinations(controller.state.board,index,controller.activeConfig)){const at=this.position(destination);this.selection.strokeRoundedRect(at.x-half,at.y-half,half*2,half*2,Math.max(4,this.geometry.size*.09));}} }
  release(pointer: { x: number; y: number; id: number }) { if (controller.phase !== 'PLAYING' || ads?.flow.locked) return; const target = this.hit(pointer); if (upgradeArmed) { this.clearGesture(); if (target === null) return; const next = controller.useUpgrade(target); if (!next) { this.message('Upgrade a Tier I–IV reactor cell. Tier V is already maximum.'); return; } upgradeArmed = false; audio.play('merge', controller.state.board[target]); this.render(); this.hud(); this.message('Reactor cell upgraded. No heat or move added.'); return; } const action = this.gesture.end(target, pointer.id); this.highlight(); if (!action) return; const turn = controller.act(...action); if (!turn) { this.message('Choose an empty neighbor or the same tier. No diagonals.'); return; } (window as Window & { __reactorLastSpawn?: string }).__reactorLastSpawn = turn.spawned === null ? '—' : `${turn.spawned} / Tier ${turn.spawnTier}`; this.hud(); this.message(turn.merged ? `${controller.activeConfig.tierDefinitions[turn.tier-1].name} formed.` : 'Cell repositioned.'); audio.play(turn.merged ? 'merge' : 'move', turn.tier); const source = this.cells.get(turn.from), destination = this.position(turn.to); if (!source) { this.completeTurn(); return; } this.tweens.add({ targets: source, x: destination.x, y: destination.y, scale: turn.merged ? .66 : 1, duration: controller.activeConfig.moveDuration, onComplete: () => { this.render(); const cell = this.cells.get(turn.to); if (turn.merged && cell) { cell.setScale(.66); this.tweens.add({ targets: cell, scale: 1, duration: controller.activeConfig.mergeDuration, ease: 'Back.Out' }); this.pulse(destination.x,destination.y,controller.activeConfig.tierDefinitions[turn.tier-1].color,turn.tier); } if (turn.spawned !== null) { const spawn = this.cells.get(turn.spawned); if (spawn) { spawn.setScale(.1).setAlpha(0); this.tweens.add({ targets: spawn, scale: 1, alpha: 1, duration: controller.activeConfig.spawnDuration }); } } this.time.delayedCall(Math.max(controller.activeConfig.mergeDuration,controller.activeConfig.spawnDuration), () => this.completeTurn()); } }); if (controller.state.heat >= controller.activeConfig.heatWarningThreshold) audio.play('warning'); }
  completeTurn() { controller.finish(); this.hud(); if (controller.phase === 'RESULT') this.showResult(); ads?.settled(); }
  tweenCount() { return this.tweens.getTweens().length; }
  toggleDebug(key: keyof ReactorScene['debug']) { this.debug[key] = !this.debug[key]; this.layoutBoard(); this.render(); this.highlight(); return this.debug[key]; }
  pulse(x: number, y: number, color: number, tier: number) { const ring=this.add.circle(x,y,this.geometry.size*.16).setStrokeStyle(Math.max(1,this.geometry.size*.025),color).setData('effect',true); this.effects++; this.tweens.add({targets:ring,scale:2.1,alpha:0,duration:250,onComplete:()=>{ring.destroy();this.effects--;}}); for(let index=0;index<Math.min(8,tier+3);index++){const angle=index*Math.PI*2/(tier+3),spark=this.add.circle(x,y,Math.max(1,this.geometry.size*.025),color).setData('effect',true);this.effects++;this.tweens.add({targets:spark,x:x+Math.cos(angle)*this.geometry.size*.4,y:y+Math.sin(angle)*this.geometry.size*.4,alpha:0,duration:220,onComplete:()=>{spark.destroy();this.effects--;}});} }
  hud() { const state=controller.state, cfg=controller.activeConfig, stability=Math.min(100,state.stability/cfg.stabilityTarget*100), heat=heatPercent(state.heat,cfg.heatMaximum); el('stability').textContent=String(state.stability); el('stability-label').textContent=`${state.stability} / ${cfg.stabilityTarget}`; el('moves').textContent=String(state.moves); el('heat').textContent=`${heat}%`; el('heat-bar').style.width=`${heat}%`; el('heat-label').textContent=state.heat>=cfg.heatWarningThreshold?'⚠ CRITICAL HEAT':'CORE HEAT'; el('cool-count').textContent=String(state.coolCoreRemaining); el('upgrade-count').textContent=String(state.upgradeRemaining); el('portrait-cool-count').textContent=String(state.coolCoreRemaining); el('portrait-upgrade-count').textContent=String(state.upgradeRemaining); best=Math.max(best,state.score); el('best').textContent=String(best); el('game-shell').classList.toggle('danger',state.heat>=cfg.heatWarningThreshold); document.documentElement.style.setProperty('--stability',`${stability*3.6}deg`); document.documentElement.style.setProperty('--heat',`${heat}%`); ads?.sync(); }
  message(value:string) { el('hint').textContent=value; }
  showResult() { if(completedRecorded || controller.phase !== 'RESULT') return; const win=controller.state.result==='WIN'; audio.play(win?'win':'fail'); if(win){const ring=this.add.circle(this.scale.width/2,this.scale.height/2,20).setStrokeStyle(4,0xa5f5fa).setData('effect',true);this.tweens.add({targets:ring,scale:12,alpha:0,duration:650,onComplete:()=>ring.destroy()});}else{this.cameras.main.shake(250,.012);this.cameras.main.flash(250,255,70,60);this.pulse(this.scale.width/2,this.scale.height/2,0xff625e,5);} recordCompletion(); const terminalState=controller.state; this.time.delayedCall(600,menuPresentation.guard(()=>controller.phase==='RESULT' && controller.state===terminalState,()=>showMenuResult(win)));  }
}

const game = new Phaser.Game({ type: Phaser.AUTO, parent: 'board', width: 600, height: 600, backgroundColor: '#09141e', antialias: true, scene: ReactorScene, scale: { mode: Phaser.Scale.RESIZE }, input: { mouse: false, touch: false }, audio: { noAudio: true } });
const scene = () => game.scene.getScene(REACTOR_SCENE_KEY) as ReactorScene;
const resizeBoard = () => {
  const shell=el('game-shell'), mode=layoutMode(shell.clientWidth,shell.clientHeight);
  viewportSupported=updateViewportFallback(shell.clientWidth,shell.clientHeight);
  const current=scene(); if(current?.grid){const held=!viewportSupported || !!ads?.flow.suspended;current.time.paused=held;if(held){current.tweens.pauseAll();current.clearGesture();}else current.tweens.resumeAll();}
  if(shell.dataset.layout!==mode)shell.dataset.layout=mode;
  el('mode-label').textContent=mode==='wide'?'REACTOR CONTAINMENT':'CONTAINMENT GRID';
  const rect=el('board').getBoundingClientRect(),width=Math.round(rect.width),height=Math.round(rect.height);
  if(width>0&&height>0&&(game.scale.width!==width||game.scale.height!==height))game.scale.resize(width,height);
};
let resizeFrame=0;
const scheduleResize=()=>{if(!resizeFrame)resizeFrame=requestAnimationFrame(()=>{resizeFrame=0;resizeBoard();});};
const resizeObserver=new ResizeObserver(scheduleResize);resizeObserver.observe(el('game-shell'));
window.addEventListener('resize',scheduleResize);scheduleResize();
window.addEventListener('pagehide',()=>{resizeObserver.disconnect();cancelAnimationFrame(resizeFrame);window.removeEventListener('resize',scheduleResize);},{once:true});

function message(value:string) { scene().message(value); }
function startRun() { if(controller.phase !== 'RESOLVING') ads?.flow.freshRun(); }
function pause() { ads?.flow.pause(); }
function resume() { ads?.flow.resume(); }
function cool() { if(ads?.flow.canRefill('cool')) { void ads.flow.refill('cool'); return; } if(ads?.flow.locked)return; const next=controller.useCoolCore(); if(!next){message(controller.state.coolCoreRemaining<=0?'Cool Core has been used.':'Heat is already stable.');return;} audio.play('move'); scene().hud(); message(`Cool Core reduced heat by ${controller.activeConfig.coolCoreAmount}.`); }
function armUpgrade() { if(ads?.flow.canRefill('upgrade')) { void ads.flow.refill('upgrade'); return; } if(ads?.flow.locked)return; if(controller.state.upgradeRemaining<=0){message('Upgrade charge has been used.');return;} if(controller.phase!=='PLAYING')return; upgradeArmed=!upgradeArmed; message(upgradeArmed?'UPGRADE ARMED — select a Tier I–IV cell.':'Upgrade cancelled.'); }
function recordCompletion() { const result=controller.state.result; if(completedRecorded || !result) return; completedRecorded=true; const state=controller.state; const scores=recordScore({score:state.score,moves:state.moves,result}); best=scores[0]?.score??best; sessionLog.push({result,reason:state.reason,score:state.score,moves:state.moves,duration:Math.round((performance.now()-runStartedAt)/1000),peakHeat:state.peakHeat,stability:state.stability,merges:[...state.mergeCounts],coolUsed:state.coolUsed,upgradeUsed:state.upgradeUsed,coolGranted:state.coolGranted,upgradeGranted:state.upgradeGranted}); if(sessionLog.length>100)sessionLog.shift(); }
function resetMenuPresentation() { menuPresentation.reset(view=>{el('menu-kicker').textContent=view.kicker;el('menu-title').textContent=view.title;el('menu-copy').textContent=view.copy;el('start').textContent=view.start;el('menu-overlay').classList.remove('failed');}); }
function returnToMenu() { if(!ads?.flow.menu())return false;scene().clean();resetMenuPresentation();el('pause-overlay').hidden=true;el('scores-overlay').hidden=true;el('menu-overlay').hidden=false;return true; }
function showMenuResult(win:boolean) { const state=controller.state; el('menu-kicker').textContent=win?'CONTAINMENT SECURED':'CONTAINMENT FAILURE'; el('menu-title').textContent=win?'REACTOR STABLE':'CORE OVERLOAD'; el('menu-copy').textContent=`${state.reason}. Score ${state.score} · ${state.moves} moves · High score ${best}.`; el('start').textContent='REINITIALIZE REACTOR'; el('menu-overlay').hidden=false; el('menu-overlay').classList.toggle('failed',!win); }
function showScores() { const entries=readScores(); el('score-list').innerHTML=entries.length?entries.map(entry=>`<li><b>${entry.score}</b><span>${entry.moves} MOVES · ${entry.result}</span></li>`).join(''):'<li><span>No completed runs yet.</span></li>'; el('scores-overlay').hidden=false; }
for(const id of ['pause','portrait-pause'])el(id).onclick=pause; for(const id of ['cool','portrait-cool'])el(id).onclick=cool; for(const id of ['upgrade','portrait-upgrade'])el(id).onclick=armUpgrade; for(const id of ['scores','portrait-scores'])el(id).onclick=showScores;
el('start').onclick=()=>{void ads?.flow.start();}; el('resume').onclick=resume; el('sound').onclick=()=>{audio.setMuted(!audio.muted);el('sound').textContent=audio.muted?'SOUND OFF':'SOUND ON';}; el('restart').onclick=()=>{void ads?.flow.start();}; el('main-menu').onclick=returnToMenu; el('close-scores').onclick=()=>el('scores-overlay').hidden=true;

ads = connectReactorAds(controller, audio, {
  start: () => { el('pause-overlay').hidden = true; scene().startRun(); },
  cancelGesture: () => { const s=scene(); if(s?.grid){s.gesture.down=null;s.gesture.pointer=null;s.highlight();} },
  feedback: message,
  refresh: () => { if(scene()?.grid) scene().hud(); },
  freeze: value => { const s=scene(); if(!s?.grid)return; const held=value || !viewportSupported;s.time.paused=held; if(held)s.tweens.pauseAll();else s.tweens.resumeAll(); },
});

if (import.meta.env.DEV) { void import('./dev-panel.ts').then(({ mountDevPanel }) => mountDevPanel({ controller, game, scene, audio, sessionLog, locked: () => !!ads?.flow.locked || controller.phase === 'RESOLVING' || !!document.querySelector('dialog[open]'), menu: returnToMenu, startRun, showScores, message, runDuration: () => runStartedAt ? Math.round((performance.now()-runStartedAt)/1000) : 0, render: () => { scene().layoutBoard(); scene().render(); scene().hud(); }, resetDefaults: () => { Object.assign(controller.runtimeConfig, copyConfig(DEFAULT_CONFIG)); clampConfig(controller.runtimeConfig); message('Runtime tuning reset. Structural changes apply on restart.'); }, recordCompletion, qaState: () => ({phase:controller.phase,runId:ads?.flow.runId,pendingTransition:ads?.flow.pending,adSuspended:ads?.flow.suspended,bridgeConnected:ads?.client.connected,capabilities:ads?.client.capabilities,error:ads?.flow.lastResult,gridWidth:controller.activeConfig.gridWidth,gridHeight:controller.activeConfig.gridHeight,board:[...controller.state.board],heat:controller.state.heat,heatMaximum:controller.activeConfig.heatMaximum,stability:controller.state.stability,stabilityTarget:controller.activeConfig.stabilityTarget,moves:controller.state.moves,score:controller.state.score,selection:scene().gesture.selected,upgradeArmed,resolution:controller.phase==='RESOLVING',pauseQueued:ads?.flow.pauseQueued,inventory:{cool:controller.state.coolCoreRemaining,upgrade:controller.state.upgradeRemaining},used:{cool:controller.state.coolUsed,upgrade:controller.state.upgradeUsed},granted:{cool:controller.state.coolGranted,upgrade:controller.state.upgradeGranted},shownAttempts:{...ads?.flow.attempts},completedRecorded,sessionLogCount:sessionLog.length,viewportSupported}), finalize: () => { scene().clean(); scene().showResult(); scene().hud(); } })); }
