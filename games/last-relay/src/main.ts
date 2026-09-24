import Phaser from 'phaser';
import { DEFENCES, ENEMIES, SETTINGS, WAVES } from './config.ts';
import { Match } from './model.ts';
import { readRecord, saveRecord } from './storage.ts';
import './style.css';
import type { Lane } from './config.ts';

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const match = new Match();
const qaEnabled = import.meta.env.DEV && new URLSearchParams(location.search).has('qa');
const record = qaEnabled ? { reduced: false, bestWave: 0, bestKills: 0, victory: false } : readRecord();
let selected = 0, paused = false, accumulator = 0, saved = false, statusMessage = '', messageUntil = 0;
// Explicit development fixtures. Vite removes this branch from production builds.
let qaMode = '', frameSamples: number[] = [], qaPeakEffects = 0, qaPeakEnemies = 0;
if (qaEnabled) {
  const panel = document.createElement('aside'); panel.id = 'qa';
  panel.innerHTML = '<button id="qa-pressure">Pressure fixture</button><button id="qa-campaign">Campaign 20×</button><button id="qa-defeat">Defeat fixture</button><button id="qa-reset">Reset fixture</button><output id="qa-metrics">QA READY</output>';
  document.body.append(panel);
  $('qa-pressure').onclick = () => { start(); qaMode = 'pressure'; frameSamples = []; qaPeakEffects = qaPeakEnemies = 0; match.energy = 1000; match.purchase(0, 'rapid'); match.purchase(1, 'heavy'); match.purchase(2, 'rapid'); match.launch(); match.nextSpawn = WAVES[0].spawns.length; };
  $('qa-campaign').onclick = () => { start(); qaMode = 'campaign'; match.purchase(0, 'rapid'); match.purchase(1, 'rapid'); };
  $('qa-defeat').onclick = () => { start(); qaMode = ''; match.launch(); match.relayHP = 2; const e = match.spawn(0, 'heavy')!; e.progress = .9999; };
  $('qa-reset').onclick = () => { qaMode = ''; start(); };
}
const laneButtons = [...document.querySelectorAll<HTMLButtonElement>('[data-lane]')];
const reduced = $('reduced') as HTMLInputElement;
reduced.checked = record.reduced;
$('app').classList.toggle('reduced', record.reduced);
reduced.onchange = () => { record.reduced = reduced.checked; $('app').classList.toggle('reduced', record.reduced); if (!qaEnabled) saveRecord(record); };
function bestText() { $('best').textContent = record.bestWave ? `BEST / ${record.victory ? 'UPLINK RESTORED' : `WAVE ${record.bestWave} OF 10`} / ${record.bestKills} ELIMINATED` : 'LOCAL RECORD / NO TRANSMISSIONS YET'; }
bestText();
function select(lane: number) { selected = lane; sync(); }
laneButtons.forEach((button, lane) => button.onclick = () => select(lane));
function purchase(type: 'rapid' | 'heavy') {
  if (paused) return;
  if (match.purchase(selected, type)) { statusMessage = `${type === 'rapid' ? 'Rapid turret' : 'Heavy cannon'} online in lane 0${selected + 1}.`; messageUntil = performance.now() + 2200; }
  sync();
}
$('rapid').onclick = () => purchase('rapid'); $('heavy').onclick = () => purchase('heavy');
$('launch').onclick = () => { if (!paused) match.launch(); sync(); };
function start() { match.start(); saved = false; paused = false; accumulator = 0; statusMessage = ''; selected = 0; $('overlay').classList.add('hidden'); $('overlay').dataset.mode = 'menu'; sync(); }
$('begin').onclick = () => { if (paused) { paused = false; $('overlay').classList.add('hidden'); sync(); } else start(); };
function showPause() {
  if (!['PREPARING', 'WAVE_ACTIVE', 'WAVE_COMPLETE'].includes(match.phase)) return;
  paused = true; $('overlay').classList.remove('hidden'); document.querySelector('h1')!.innerHTML = 'SIGNAL<br><span>HELD</span><i>.</i>';
  $('overlay').dataset.mode = 'paused'; document.querySelector('.transmission b')!.textContent = 'TRANSMISSION PAUSED';
  $('story').innerHTML = 'Simulation paused. Your relay is secure.<br>Resume when you are ready.'; $('begin').innerHTML = 'RESUME UPLINK <span>→</span>';
}
$('pause').onclick = showPause;
document.addEventListener('visibilitychange', () => { if (document.hidden) showPause(); accumulator = 0; });
window.addEventListener('resize', () => { if (innerWidth < innerHeight && innerWidth < 700) showPause(); });
function resultOverlay() {
  if (saved) return; saved = true;
  record.bestWave = Math.max(record.bestWave, match.wave + 1); record.bestKills = Math.max(record.bestKills, match.kills); record.victory ||= match.result === 'VICTORY'; if (!qaEnabled) saveRecord(record); bestText();
  $('overlay').classList.remove('hidden'); const won = match.result === 'VICTORY';
  $('overlay').dataset.mode = won ? 'victory' : 'defeat'; document.querySelector('.transmission b')!.textContent = won ? 'TRANSMISSION RECEIVED' : 'CONNECTION LOST';
  document.querySelector('h1')!.innerHTML = won ? 'SIGNAL<br><span>RESTORED</span><i>.</i>' : 'SIGNAL<br><span>LOST</span><i>.</i>';
  $('story').innerHTML = `${won ? 'Transmission received. The relay held.' : 'The last relay has fallen silent.'}<br>Wave ${match.wave + 1} / 10 · ${match.kills} hostiles eliminated · ${Math.floor(match.elapsed / 60)}m ${Math.floor(match.elapsed % 60)}s`;
  $('begin').innerHTML = 'RECONNECT / PLAY AGAIN <span>→</span>';
}
function sync() {
  $('wave').innerHTML = `${String(match.wave + 1).padStart(2, '0')} <i>/ 10</i>`;
  $('health').innerHTML = `${match.relayHP} <i>/ ${SETTINGS.relayHP}</i>`; $('health').classList.toggle('critical', match.relayHP <= 3); $('energy').textContent = String(match.energy);
  const playing = !paused && ['PREPARING', 'WAVE_ACTIVE'].includes(match.phase);
  for (const type of ['rapid', 'heavy'] as const) { const button = $<HTMLButtonElement>(type); button.disabled = !playing || match.energy < DEFENCES[type].cost; button.setAttribute('aria-label', `${match.defences[selected] ? 'Replace with' : 'Buy'} ${type === 'rapid' ? 'Rapid Turret' : 'Heavy Cannon'} for ${DEFENCES[type].cost} energy`); }
  laneButtons.forEach((button, lane) => { button.classList.toggle('selected', selected === lane); button.classList.toggle('installed', !!match.defences[lane]); button.setAttribute('aria-pressed', String(selected === lane)); button.disabled = !playing; });
  $('lane-label').textContent = `LANE 0${selected + 1} SELECTED`;
  $('hint').textContent = performance.now() < messageUntil ? statusMessage : match.defences[selected] ? `${match.defences[selected]!.type === 'rapid' ? 'Rapid turret' : 'Heavy cannon'} online. Replacement costs full price.` : 'Empty slot. Select a defence to install.';
  const launch = $<HTMLButtonElement>('launch'); launch.disabled = paused || match.phase !== 'PREPARING';
  launch.innerHTML = match.phase === 'PREPARING' ? `LAUNCH / ${Math.max(0, Math.ceil(match.countdown))}s <span>→</span>` : match.phase === 'WAVE_COMPLETE' ? 'SECTOR CLEAR ✓' : `INBOUND ${Math.max(0, WAVES[match.wave].spawns.length - match.nextSpawn)} · ACTIVE ${match.count}`;
  $('banner').textContent = match.phase === 'PREPARING' ? `WAVE ${match.wave + 1} / ${WAVES[match.wave].title.toUpperCase()}` : match.phase === 'WAVE_COMPLETE' ? 'PERIMETER SECURE / NEXT WAVE APPROACHING' : match.waveTime < 2 && match.phase === 'WAVE_ACTIVE' ? 'CONTACT / HOSTILES APPROACHING' : '';
  $<HTMLButtonElement>('pause').disabled = !['PREPARING', 'WAVE_ACTIVE', 'WAVE_COMPLETE'].includes(match.phase);
  if (match.phase === 'RESULT') resultOverlay();
}

class Battlefield extends Phaser.Scene {
  private ink!: Phaser.GameObjects.Graphics;
  private uiClock = 0;
  create() { this.ink = this.add.graphics(); sync(); }
  update(_time: number, delta: number) {
    if (!paused) {
      accumulator += Math.min(delta / 1000, SETTINGS.maxFrameDelta) * (qaMode === 'campaign' ? 20 : 1);
      while (accumulator >= SETTINGS.fixedStep) {
        if (qaMode === 'campaign') {
          if (!match.defences[2] && match.energy >= 50) match.purchase(2, 'rapid');
          if (match.wave >= 3) for (let lane = 0; lane < 3; lane++) if (match.defences[lane]?.type === 'rapid' && match.energy >= 75) match.purchase(lane, 'heavy');
        }
        if (qaMode === 'pressure' && match.phase === 'WAVE_ACTIVE') {
          while (match.count < 10) { const e = match.spawn((match.spawned % 3) as Lane, (['standard', 'runner', 'heavy'] as const)[match.spawned % 3])!; e.progress = .5; }
          for (const lane of match.lanes) for (const e of lane) e.progress = Math.min(e.progress, .9);
        }
        match.step(SETTINGS.fixedStep); accumulator -= SETTINGS.fixedStep;
      }
    }
    this.uiClock += delta; if (this.uiClock >= 100) { sync(); this.uiClock = 0; }
    this.paint();
    if (qaEnabled) {
      qaPeakEnemies = Math.max(qaPeakEnemies, match.count); qaPeakEffects = Math.max(qaPeakEffects, match.effects.length);
      if (!paused && qaMode === 'pressure' && frameSamples.length < 1800) frameSamples.push(delta);
      if (this.uiClock === 0) {
        const sorted = [...frameSamples].sort((a, b) => a - b);
        $('qa-metrics').textContent = `${qaMode || 'manual'} / ${match.phase} / ${match.result ?? '—'} / ${match.count} active / peak ${qaPeakEnemies} / VFX peak ${qaPeakEffects} / ${match.kills} kills / ${frameSamples.length} frames / p50 ${sorted[Math.floor(sorted.length * .5)]?.toFixed(1) ?? '—'}ms / p95 ${sorted[Math.floor(sorted.length * .95)]?.toFixed(1) ?? '—'}ms`;
      }
    }
  }
  private paint() {
    const g = this.ink, w = this.scale.width, h = this.scale.height;
    const sx = w / 1200, sy = h / 480;
    g.clear(); g.setScale(sx, sy);
    g.fillStyle(0x0d1924); g.fillRect(0, 0, 1200, 480);
    // Quiet topographic panels, apron hatching and utilitarian lane rails.
    g.lineStyle(1, 0x1c2c38, .7);
    for (let x = 0; x < 1200; x += 60) { g.lineBetween(x, 0, x - 70, 480); }
    for (let y = 0; y <= 480; y += 40) g.lineBetween(0, y, 1200, y);
    for (let l = 0; l < 3; l++) {
      const y = 120 + l * 120;
      g.fillStyle(0x132431); g.fillRoundedRect(175, y - 45, 1010, 90, 5);
      g.fillStyle(0x172b37); g.fillRect(335, y - 30, 835, 60);
      g.lineStyle(1, 0x344b57); g.lineBetween(185, y - 44, 1180, y - 44); g.lineBetween(185, y + 44, 1180, y + 44);
      g.lineStyle(1, 0x35515f, .7); for (let x = 365; x < 1170; x += 64) g.lineBetween(x, y, x + 20, y);
      for (let x = 1140; x < 1180; x += 12) { g.lineStyle(3, 0xa56a49, .35); g.lineBetween(x, y - 28, x - 18, y + 28); }
      const danger = match.lanes[l].some(e => e.progress > .77);
      if (danger) { g.lineStyle(3, 0xff775a, record.reduced ? .8 : .45 + Math.sin(this.time.now / 150) * .25); g.strokeRect(176, y - 45, 155, 90); }
      g.lineStyle(2, 0x4a9daa, .6); g.lineBetween(127, y, 210, y);
      const tower = match.defences[l];
      if (tower) {
        const recoil = record.reduced ? 0 : tower.recoil * 24;
        g.fillStyle(0x080f16); g.fillEllipse(257, y + 22, 68, 19);
        g.fillStyle(0x2e4d60); g.fillRoundedRect(230, y - 23, 54, 48, 5); g.lineStyle(2, 0x6ec5d4); g.strokeRoundedRect(230, y - 23, 54, 48, 5);
        g.fillStyle(0x8bdce8);
        if (tower.type === 'rapid') { g.fillRect(258 - recoil, y - 13, 39, 7); g.fillRect(258 - recoil, y + 6, 39, 7); }
        else { g.fillRoundedRect(249 - recoil, y - 11, 48, 22, 3); g.fillStyle(0x274759); g.fillRect(275 - recoil, y - 7, 20, 14); }
        g.fillStyle(0xcaeff4); g.fillCircle(245, y, 5);
        const cooldown = tower.cooldown / DEFENCES[tower.type].cooldown; g.fillStyle(0x68cedb, .6); g.fillRect(232, y + 30, 50 * (1 - cooldown), 3);
      }
      for (const enemy of match.lanes[l]) {
        const spec = ENEMIES[enemy.variant], x = 1120 - enemy.progress * 925, size = 18 * spec.scale;
        g.fillStyle(0x02070c, .6); g.fillEllipse(x + 4, y + size, size * 2.8, size);
        g.lineStyle(4 * spec.scale, 0x576674); g.lineBetween(x - size, y - size * .7, x - size * 1.4, y - size * 1.1); g.lineBetween(x - size, y + size * .7, x - size * 1.4, y + size * 1.1); g.lineBetween(x + size, y - size * .7, x + size * 1.4, y - size * 1.1); g.lineBetween(x + size, y + size * .7, x + size * 1.4, y + size * 1.1);
        g.fillStyle(enemy.flash > 0 ? 0xfff1ce : 0x344451); g.fillRoundedRect(x - size, y - size, size * 2, size * 2, 5);
        g.lineStyle(2, spec.color); g.strokeRoundedRect(x - size, y - size, size * 2, size * 2, 5);
        g.fillStyle(spec.color); g.fillTriangle(x - size - 5, y, x - size + 5, y - 7, x - size + 5, y + 7);
        const marks = enemy.variant === 'heavy' ? 3 : enemy.variant === 'runner' ? 1 : 2;
        for (let k = 0; k < marks; k++) g.fillRect(x - 4 + k * 6, y - size + 6, 3, size * 2 - 12);
        g.fillStyle(0x060d14); g.fillRect(x - size, y - size - 9, size * 2, 3); g.fillStyle(spec.color); g.fillRect(x - size, y - size - 9, size * 2 * enemy.hp / enemy.maxHP, 3);
      }
    }
    // Relay silhouette and segmented integrity meter stay clear of controls.
    g.fillStyle(0x07111b); g.fillRoundedRect(40, 138, 93, 207, 8); g.lineStyle(2, 0x426c7d); g.strokeRoundedRect(40, 138, 93, 207, 8);
    g.fillStyle(0x284759); g.fillRect(54, 160, 65, 161); g.fillStyle(match.relayHP <= 3 ? 0xff785f : 0xb0eff4); g.fillRect(79, 170, 15, 132);
    g.lineStyle(4, 0x76b5c4); g.lineBetween(87, 138, 87, 91); g.lineBetween(64, 104, 110, 104); g.fillStyle(0xc1f9fb); g.fillCircle(87, 88, 5);
    for (let i = 0; i < 10; i++) { g.fillStyle(i < match.relayHP ? (match.relayHP <= 3 ? 0xeb6d56 : 0x70d8e2) : 0x253947); g.fillRect(42 + i * 9, 359, 6, 12); }
    for (const effect of match.effects) {
      const y = 120 + effect.lane * 120, x = 1120 - effect.progress * 925, alpha = effect.ttl / effect.duration;
      if (effect.kind === 'shot') { g.lineStyle(effect.heavy ? 4 : 2, effect.heavy ? 0xe7eecc : 0x87ebff, alpha); g.lineBetween(297, y, x, y); if (!record.reduced) { g.fillStyle(0xcafaff, alpha); g.fillCircle(297, y, effect.heavy ? 9 : 5); } }
      if (effect.kind === 'death') { const radius = (1 - alpha) * 28; g.lineStyle(2, 0xffad69, alpha); g.strokeCircle(x, y, radius); if (!record.reduced) for (let k = 0; k < 4; k++) { const angle = k * Math.PI / 2 + .4; g.fillStyle(0xffca8d, alpha); g.fillRect(x + Math.cos(angle) * radius - 2, y + Math.sin(angle) * radius - 2, 4, 4); } }
      if (effect.kind === 'relay') { g.lineStyle(4, 0xff735e, alpha); g.strokeRoundedRect(35, 133, 103, 217, 8); }
      if (effect.kind === 'install') { g.lineStyle(2, 0xa2f4f3, alpha); g.strokeCircle(257, y, 30 + (1 - alpha) * 15); }
    }
    if (match.result === 'VICTORY' && !record.reduced) { g.lineStyle(2, 0xa2f4f3, .4); g.strokeCircle(87, 88, (this.time.now / 10) % 170); }
  }
}
new Phaser.Game({ type: Phaser.AUTO, parent: 'canvas', backgroundColor: '#0d1924', scene: Battlefield, scale: { mode: Phaser.Scale.RESIZE, width: '100%', height: '100%' }, render: { antialias: true, roundPixels: false }, audio: { noAudio: true }, banner: false });
sync();
