import Phaser from 'phaser';
import './style.css';
import { config as c } from './config.ts';
import { TurnController } from './rules.ts';
import { Gesture, cellAt } from './input.ts';
import { readBest, saveBest } from './storage.ts';

document.querySelector('#app')!.innerHTML = `
<header><div><div class="eyebrow">HRISTO STUDIOS / 002</div><h1>REACTOR STACK</h1></div><span class="signal">● ONLINE</span></header>
<section class="stats"><div><div class="label">OUTPUT / SCORE</div><div class="number" id="score">0000</div></div><div class="objective"><div class="label">STABILIZE THE CORE</div><div class="number"><strong id="stability">0 / 100</strong></div></div></section>
<div class="track"><span id="stability-bar"></span></div><div class="board-heading"><span>CONTAINMENT GRID</span><span id="turn">TURN 00</span></div><div id="board" aria-label="Five column, six row reactor board"></div>
<div class="heat-heading"><span id="heat-label">CORE TEMPERATURE</span><span id="heat">0%</span></div><div class="track"><span id="heat-bar"></span></div>
<p id="hint" aria-live="polite">Tap a cell, then a neighbor. Match equal tiers to merge.</p><nav><button id="restart">RESTART</button><button id="menu">MENU</button><button id="audio" aria-pressed="true">SOUND ON</button></nav><footer><span>EXPERIMENTAL ENERGY SYSTEMS</span><span id="best">BEST 0</span></footer>
<section class="overlay" id="overlay"><div class="panel"><div class="reactor-icon">◈</div><div class="eyebrow" id="kicker">CONTAINMENT PROTOCOL / 002</div><h2 id="title">REACTOR<br>STACK</h2><p id="description">A damaged reactor. Thirty containment slots.<br>Combine energy cells before the core overheats.</p><div class="tiers"><span>Ⅰ ION</span><span>Ⅱ FLUX</span><span>Ⅲ PLASMA</span><span>Ⅳ FUSION</span><span>Ⅴ CORE</span></div><button class="primary" id="start">INITIALIZE REACTOR →</button><small id="instructions">Drag or tap into one neighboring slot.<br>Equal tiers merge. Every move adds heat.<br>Reach 100 stability to secure the reactor.</small></div></section>`;
const el = (id: string) => document.getElementById(id)!;
let audio: AudioContext | undefined, muted = false;
function tone(kind: 'move' | 'merge' | 'win' | 'fail' | 'warning', tier = 1) {
  if (muted) return;
  try {
    audio ??= new AudioContext(); void audio.resume();
    const oscillator = audio.createOscillator(), gain = audio.createGain();
    oscillator.type = kind === 'fail' ? 'sawtooth' : 'sine';
    const f = kind === 'fail' ? 120 : kind === 'win' ? 660 : kind === 'warning' ? 160 : 180 + tier * 90;
    oscillator.frequency.setValueAtTime(f, audio.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(kind === 'fail' ? 35 : f * 1.5, audio.currentTime + .16);
    gain.gain.setValueAtTime(.045, audio.currentTime); gain.gain.exponentialRampToValueAtTime(.001, audio.currentTime + .22);
    oscillator.connect(gain); gain.connect(audio.destination); oscillator.start(); oscillator.stop(audio.currentTime + .24);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
  } catch { /* Audio is optional. */ }
}

class ReactorScene extends Phaser.Scene {
  controller = new TurnController(); gesture = new Gesture(); best = readBest();
  cells = new Map<number, Phaser.GameObjects.Container>();
  selection!: Phaser.GameObjects.Graphics;
  create() {
    const grid = this.add.graphics();
    for (let i = 0; i < 30; i++) { const { x, y } = this.position(i); grid.fillStyle(0x152735); grid.fillRoundedRect(x - 36, y - 36, 72, 72, 7); grid.lineStyle(1, 0x263f4d); grid.strokeRoundedRect(x - 36, y - 36, 72, 72, 7); }
    this.selection = this.add.graphics().setDepth(10);
    this.controller.phase = 'MENU';
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => { if (this.controller.phase === 'PLAYING') this.gesture.begin(cellAt(p.x,p.y,0,0,80), p.id); });
    this.input.on('pointerup', (p: Phaser.Input.Pointer) => this.release(p));
    this.input.on('pointerupoutside', () => { this.gesture.reset(); this.highlight(); });
    const cancel = () => { this.gesture.reset(); this.highlight(); };
    this.game.events.on(Phaser.Core.Events.BLUR, cancel);
    this.events.once('shutdown', () => this.game.events.off(Phaser.Core.Events.BLUR, cancel));
    el('start').onclick = () => { tone('move'); this.start(); };
    el('restart').onclick = () => this.start();
    el('menu').onclick = () => { this.clean(); this.controller.phase = 'MENU'; this.showMenu(); };
    el('audio').onclick = () => { muted = !muted; el('audio').textContent = muted ? 'SOUND OFF' : 'SOUND ON'; el('audio').setAttribute('aria-pressed', String(!muted)); };
    this.hud();
  }
  position(i: number) { return { x: i % 5 * 80 + 40, y: Math.floor(i / 5) * 80 + 40 }; }
  clean() { this.tweens.killAll(); this.time.removeAllEvents(); this.gesture.reset(); this.selection.clear(); this.cameras.main.resetFX(); this.children.list.filter(o => o.getData('effect')).forEach(o => o.destroy()); }
  start() {
    this.clean(); this.controller.start();
    // Explicit development-only fixtures let browser QA exercise terminal feedback
    // through real pointer actions. Vite removes this block from production.
    if (import.meta.env.DEV) {
      const qa = new URLSearchParams(location.search).get('qa');
      const state = this.controller.state;
      if (qa === 'win' || qa === 'heat' || qa === 'tiers') {
        state.board.fill(0);
        if (qa === 'win') { state.board[0] = state.board[1] = 4; state.stability = 76; }
        if (qa === 'heat') { state.board[0] = 1; state.heat = 96; }
        if (qa === 'tiers') { state.board.splice(0, 5, 1, 2, 3, 4, 5); }
      }
    }
    el('overlay').hidden = true; this.render(); this.hud(); el('hint').textContent = 'Tap a cell, then a neighbor. Match equal tiers to merge.';
  }
  showMenu() { el('overlay').classList.remove('failed'); el('overlay').hidden = false; el('kicker').textContent = 'CONTAINMENT PROTOCOL / 002'; el('title').innerHTML = 'REACTOR<br>STACK'; el('description').innerHTML = 'A damaged reactor. Thirty containment slots.<br>Combine energy cells before the core overheats.'; el('start').textContent = 'INITIALIZE REACTOR →'; }
  cell(index: number, tier: number) {
    const { x, y } = this.position(index), color = c.tierDefinitions[tier - 1].color;
    const node = this.add.container(x, y), g = this.add.graphics();
    g.fillStyle(color, .085); g.fillRoundedRect(-33,-33,66,66,6); g.lineStyle(1.5,color,.8);
    const polygon = (radius: number, points: number, rotation = 0) => { const pts = Array.from({length:points},(_,i)=>new Phaser.Math.Vector2(Math.cos(i/points*Math.PI*2+rotation)*radius,Math.sin(i/points*Math.PI*2+rotation)*radius-4)); g.strokePoints(pts,true); };
    if (tier === 1) g.strokeCircle(0,-4,15);
    if (tier === 2) { g.strokeCircle(0,-4,20); polygon(12,4); }
    if (tier === 3) { polygon(23,6,Math.PI/6); g.strokeCircle(0,-4,15); polygon(8,3,-Math.PI/2); }
    if (tier === 4) { polygon(24,6); polygon(22,3,-Math.PI/2); polygon(22,3,Math.PI/2); g.strokeCircle(0,-4,10); }
    if (tier === 5) { polygon(26,8,Math.PI/8); polygon(20,4); polygon(20,4,Math.PI/4); g.lineStyle(3,color); g.strokeCircle(0,-4,11); }
    g.fillStyle(color); g.fillCircle(0,-4,tier === 5 ? 7 : 3);
    const label = this.add.text(0,25,['','I','II','III','IV','V'][tier],{fontFamily:'Arial',fontSize:'10px',color:Phaser.Display.Color.IntegerToColor(color).rgba}).setOrigin(.5);
    node.add([g,label]); this.cells.set(index,node); return node;
  }
  render() { this.cells.forEach(n=>n.destroy()); this.cells.clear(); this.controller.state.board.forEach((tier,i)=>{if(tier)this.cell(i,tier);}); }
  highlight() { this.selection.clear(); const i = this.gesture.selected; if(i !== null && this.controller.state.board[i]) { const p=this.position(i); this.selection.lineStyle(2,0xc8f9ff);this.selection.strokeRoundedRect(p.x-36,p.y-36,72,72,7); } else this.gesture.selected=null; }
  release(p: Phaser.Input.Pointer) {
    if(this.controller.phase !== 'PLAYING') return;
    const action=this.gesture.end(cellAt(p.x,p.y,0,0,80),p.id); this.highlight();
    if(!action) return;
    const turn=this.controller.act(...action);
    if(!turn) { el('hint').textContent='Choose an empty neighbor or the same tier. No diagonals.'; return; }
    this.hud();
    el('hint').textContent=turn.merged ? `${c.tierDefinitions[turn.tier-1].name} formed · +${c.stabilityRewardByTier[turn.tier]} stability` : 'Cell repositioned · +4 heat';
    tone(turn.merged?'merge':'move',turn.tier);
    const source=this.cells.get(turn.from)!, target=this.position(turn.to);
    this.tweens.add({targets:source,x:target.x,y:target.y,scale:turn.merged?.65:1,duration:c.moveDuration,onComplete:()=>{
      this.render(); const dest=this.cells.get(turn.to)!;
      if(turn.merged) { dest.setScale(.65);this.tweens.add({targets:dest,scale:1,duration:c.mergeDuration,ease:'Back.Out'});this.pulse(target.x,target.y,c.tierDefinitions[turn.tier-1].color,turn.tier); }
      if(turn.spawned!==null){const spawn=this.cells.get(turn.spawned)!;spawn.setScale(.1).setAlpha(0);this.tweens.add({targets:spawn,scale:1,alpha:1,duration:c.spawnDuration});}
      this.time.delayedCall(Math.max(c.mergeDuration,c.spawnDuration),()=>{this.controller.finish();if(this.controller.phase==='RESULT')this.result();});
    }});
    if(this.controller.state.heat>=80)tone('warning');
  }
  pulse(x:number,y:number,color:number,tier:number) {
    const ring=this.add.circle(x,y,12).setStrokeStyle(2,color).setData('effect',true);
    this.tweens.add({targets:ring,scale:2.2,alpha:0,duration:250,onComplete:()=>ring.destroy()});
    for(let i=0;i<Math.min(8,tier+3);i++){const angle=i*Math.PI*2/(tier+3),spark=this.add.circle(x,y,1.5,color).setData('effect',true);this.tweens.add({targets:spark,x:x+Math.cos(angle)*33,y:y+Math.sin(angle)*33,alpha:0,duration:220,onComplete:()=>spark.destroy()});}
  }
  hud() { const s=this.controller.state; this.best=saveBest(s.score,this.best);el('score').textContent=String(s.score).padStart(4,'0');el('stability').textContent=`${s.stability} / 100`;el('stability-bar').style.width=`${s.stability}%`;el('heat').textContent=`${s.heat}%`;el('heat-bar').style.width=`${s.heat}%`;el('heat-label').textContent=s.heat>=80?'⚠ CRITICAL TEMPERATURE':'CORE TEMPERATURE';el('turn').textContent=`TURN ${String(s.turns).padStart(2,'0')}`;el('best').textContent=`BEST ${this.best}`;el('board').classList.toggle('danger',s.heat>=80); }
  result() {
    const win=this.controller.state.result==='WIN'; tone(win?'win':'fail');
    if(win){const ring=this.add.circle(200,240,20).setStrokeStyle(4,0xa5f5fa).setData('effect',true);this.tweens.add({targets:ring,scale:12,alpha:0,duration:650,onComplete:()=>ring.destroy()});}
    else{this.cameras.main.shake(250,.012);this.cameras.main.flash(250,255,70,60);this.pulse(200,240,0xff625e,5);}
    this.time.delayedCall(700,()=>{el('overlay').classList.toggle('failed',!win);el('overlay').hidden=false;el('kicker').textContent=win?'CONTAINMENT SECURED':'CONTAINMENT FAILURE';el('title').innerHTML=win?'REACTOR<br>STABLE':'CORE<br>OVERLOAD';el('description').textContent=`${this.controller.state.reason}. Output ${this.controller.state.score} · ${this.controller.state.turns} turns · Best ${this.best}`;el('start').textContent='REINITIALIZE →';});
  }
}
new Phaser.Game({type:Phaser.AUTO,parent:'board',width:400,height:480,backgroundColor:'#0b1722',transparent:false,antialias:true,scene:ReactorScene,scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},input:{activePointers:2},audio:{noAudio:true}});
