import { DEFENCES, ENEMIES, SETTINGS, WAVES } from './config.ts';
import type { DefenceType, Lane, Variant, Wave } from './config.ts';
export type Phase = 'BOOT' | 'MENU' | 'PREPARING' | 'WAVE_ACTIVE' | 'WAVE_COMPLETE' | 'RESULT';
export interface Enemy { id: number; lane: Lane; variant: Variant; hp: number; maxHP: number; progress: number; flash: number; alive: boolean }
export interface Defence { type: DefenceType; cooldown: number; recoil: number }
export interface Effect { kind: 'shot' | 'death' | 'relay' | 'install'; lane: Lane; progress: number; ttl: number; duration: number; heavy?: boolean }
export class Match {
  phase: Phase = 'BOOT';
  result: 'VICTORY' | 'DEFEAT' | null = null;
  lanes: Enemy[][] = [[], [], []];
  defences: (Defence | null)[] = [null, null, null];
  effects: Effect[] = [];
  energy: number = SETTINGS.startingEnergy;
  relayHP: number = SETTINGS.relayHP;
  wave = 0;
  waveTime = 0;
  nextSpawn = 0;
  countdown: number = SETTINGS.prepareSeconds;
  kills = 0;
  removed = 0;
  spawned = 0;
  peak = 0;
  elapsed = 0;
  private nextId = 1;
  readonly waves: Wave[];
  constructor(waves = WAVES) { this.waves = waves; this.phase = 'MENU'; }
  get count() { return this.lanes.reduce((sum, lane) => sum + lane.length, 0); }
  start() { this.clear(); this.energy = SETTINGS.startingEnergy; this.relayHP = SETTINGS.relayHP; this.wave = 0; this.kills = this.removed = this.spawned = this.peak = this.elapsed = 0; this.result = null; this.prepare(); }
  clear() { for (const lane of this.lanes) { for (const e of lane) e.alive = false; lane.length = 0; } this.effects.length = 0; this.defences.fill(null); }
  private prepare() { this.phase = 'PREPARING'; this.countdown = SETTINGS.prepareSeconds; this.waveTime = this.nextSpawn = 0; }
  launch() { if (this.phase !== 'PREPARING') return false; this.phase = 'WAVE_ACTIVE'; return true; }
  purchase(lane: number, type: DefenceType): boolean {
    if (!Number.isInteger(lane) || lane < 0 || lane > 2 || !Object.hasOwn(DEFENCES, type) || !['PREPARING', 'WAVE_ACTIVE'].includes(this.phase)) return false;
    const price = DEFENCES[type].cost;
    if (!Number.isFinite(this.energy) || this.energy < price) return false;
    this.energy -= price; this.defences[lane] = { type, cooldown: DEFENCES[type].cooldown, recoil: 0 };
    this.effect('install', lane as Lane, 1, .4); return true;
  }
  spawn(lane: Lane, variant: Variant, hpScale = 1): Enemy | null {
    if (this.phase !== 'WAVE_ACTIVE' || this.count >= SETTINGS.maxEnemies || !Number.isInteger(lane) || lane < 0 || lane > 2 || !Object.hasOwn(ENEMIES, variant) || !Number.isFinite(hpScale) || hpScale <= 0) return null;
    const hp = ENEMIES[variant].hp * hpScale;
    const enemy: Enemy = { id: this.nextId++, lane, variant, hp, maxHP: hp, progress: 0, flash: 0, alive: true };
    this.lanes[lane].push(enemy); this.spawned++; this.peak = Math.max(this.peak, this.count); return enemy;
  }
  damage(enemy: Enemy, amount: number) {
    if (this.phase !== 'WAVE_ACTIVE' || !enemy.alive || !this.lanes[enemy.lane].includes(enemy) || !Number.isFinite(amount) || amount <= 0) return;
    enemy.hp = Math.max(0, enemy.hp - amount); enemy.flash = SETTINGS.hitSeconds;
    if (enemy.hp === 0) this.remove(enemy, 'kill');
  }
  remove(enemy: Enemy, reason: 'kill' | 'endpoint') {
    if (this.phase !== 'WAVE_ACTIVE' || !enemy.alive) return;
    const lane = this.lanes[enemy.lane]; const index = lane.indexOf(enemy); if (index < 0) return;
    enemy.alive = false; lane.splice(index, 1); this.removed++;
    if (reason === 'kill') { this.kills++; this.energy += ENEMIES[enemy.variant].reward; this.effect('death', enemy.lane, enemy.progress, SETTINGS.burstSeconds); }
    else { this.relayHP = Math.max(0, this.relayHP - ENEMIES[enemy.variant].damage); this.effect('relay', enemy.lane, 1, SETTINGS.relayPulseSeconds); if (this.relayHP === 0) this.finish('DEFEAT'); }
  }
  private effect(kind: Effect['kind'], lane: Lane, progress: number, duration: number, heavy = false) {
    if (this.effects.length >= SETTINGS.maxEffects) this.effects.shift();
    this.effects.push({ kind, lane, progress, ttl: duration, duration, heavy });
  }
  private finish(result: 'VICTORY' | 'DEFEAT') { this.phase = 'RESULT'; this.result = result; for (const lane of this.lanes) { for (const e of lane) { e.alive = false; this.removed++; } lane.length = 0; } }
  step(dt: number) {
    if (!Number.isFinite(dt) || dt <= 0) return;
    dt = Math.min(dt, SETTINGS.maxFrameDelta);
    for (let i = this.effects.length - 1; i >= 0; i--) { this.effects[i].ttl -= dt; if (this.effects[i].ttl <= 0) this.effects.splice(i, 1); }
    if (this.phase === 'MENU' || this.phase === 'RESULT' || this.phase === 'BOOT') return;
    this.elapsed += dt;
    if (this.phase === 'PREPARING') { this.countdown -= dt; if (this.countdown <= 0) this.launch(); return; }
    if (this.phase === 'WAVE_COMPLETE') { this.countdown -= dt; if (this.countdown <= 0) { this.wave++; this.prepare(); } return; }
    this.waveTime += dt;
    const wave = this.waves[this.wave];
    // Backpressure retains the next scheduled spawn rather than dropping it.
    while (this.nextSpawn < wave.spawns.length && wave.spawns[this.nextSpawn].at <= this.waveTime && this.count < SETTINGS.maxEnemies) {
      const entry = wave.spawns[this.nextSpawn++]; this.spawn(entry.lane, entry.variant, wave.hpScale);
    }
    for (let l = 0; l < 3; l++) {
      const lane = this.lanes[l];
      for (let i = lane.length - 1; i >= 0; i--) {
        const enemy = lane[i]; enemy.flash = Math.max(0, enemy.flash - dt); enemy.progress += ENEMIES[enemy.variant].speed * dt;
        if (enemy.progress >= 1) this.remove(enemy, 'endpoint');
        if (this.result !== null) return;
      }
      const defence = this.defences[l]; if (!defence) continue;
      const stats = DEFENCES[defence.type]; defence.cooldown = Math.max(0, defence.cooldown - dt); defence.recoil = Math.max(0, defence.recoil - dt);
      if (defence.cooldown > 0) continue;
      let target: Enemy | undefined;
      for (const enemy of lane) if (enemy.progress >= stats.rangeStart && (!target || enemy.progress > target.progress)) target = enemy;
      if (target) { defence.cooldown = stats.cooldown; defence.recoil = .18; this.effect('shot', l as Lane, target.progress, SETTINGS.tracerSeconds, defence.type === 'heavy'); this.damage(target, stats.damage); }
    }
    if (this.nextSpawn === wave.spawns.length && this.count === 0) {
      if (this.wave === this.waves.length - 1) this.finish('VICTORY');
      else { this.phase = 'WAVE_COMPLETE'; this.countdown = SETTINGS.completeSeconds; }
    }
  }
}
