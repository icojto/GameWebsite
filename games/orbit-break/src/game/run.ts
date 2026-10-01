import { FORMATIONS, type FormationId, type GameConfig } from './config.ts';

export type RunPhase = 'menu' | 'playing' | 'paused' | 'game-over';
export interface Projectile {
  angle: number; distance: number; warningMs: number; ageMs: number; speed: number;
  group: number; crossed: boolean; hit: boolean;
}
export interface RunEvents {
  collision: boolean; dodged: number; survivedFormations: FormationId[]; reachedTier: number;
}

export class RunState {
  phase: RunPhase = 'menu';
  elapsedMs = 0;
  score = 0;
  scoreOffset = 0;
  playerAngle = -Math.PI / 2;
  direction: 1 | -1 = 1;
  nextAttackMs = 650;
  projectiles: Projectile[] = [];
  totalProjectiles = 0;
  reversals = 0;
  currentFormation: FormationId | 'none' = 'none';
  nextFormation: FormationId | 'none' = 'single';
  collisionCount = 0;
  difficultyOverride: number | null = null;
  infiniteLives = false;
  private lastFormation: FormationId | 'none' = 'none';
  private consecutive = 0;
  private groupSequence = 0;
  private groupRemaining = new Map<number, { id: FormationId; remaining: number }>();
  private lastUsed = new Map<FormationId, number>();
  private lastTier = 1;
  private readonly events: RunEvents = { collision: false, dodged: 0, survivedFormations: [], reachedTier: 0 };

  constructor(readonly config: GameConfig) {}

  start(): void {
    this.phase = 'playing'; this.elapsedMs = 0; this.score = 0; this.scoreOffset = 0;
    this.playerAngle = -Math.PI / 2; this.direction = 1; this.nextAttackMs = 650;
    this.projectiles.length = 0; this.groupRemaining.clear(); this.totalProjectiles = 0;
    this.reversals = 0; this.currentFormation = 'none'; this.nextFormation = 'single';
    this.collisionCount = 0; this.difficultyOverride = null;
    this.lastFormation = 'none'; this.consecutive = 0; this.lastUsed.clear(); this.lastTier = 1;
  }

  menu(): void {
    this.phase = 'menu'; this.projectiles.length = 0; this.groupRemaining.clear();
    this.currentFormation = 'none'; this.nextFormation = 'single';
    this.elapsedMs = 0; this.score = 0; this.scoreOffset = 0; this.difficultyOverride = null;
  }

  get difficulty(): number {
    return Math.min(this.config.difficulty.maximum, Math.max(1, this.difficultyOverride
      ?? this.config.difficulty.initial + this.elapsedMs / 1000 * this.config.difficulty.rampPerSecond));
  }

  get tier(): number {
    let tier = 1;
    for (let index = 1; index < this.config.difficulty.tierThresholds.length; index += 1) {
      if (this.difficulty >= this.config.difficulty.tierThresholds[index]) tier = index + 1;
    }
    return tier;
  }

  get attackIntervalMs(): number {
    return Math.max(this.config.difficulty.attackIntervalMinMs,
      this.config.difficulty.attackIntervalMaxMs / this.difficulty);
  }

  get activeProjectiles(): number {
    let count = 0;
    for (const projectile of this.projectiles) if (projectile.warningMs <= 0) count += 1;
    return count;
  }

  availableFormations(): FormationId[] {
    const eligible = FORMATIONS.filter((id) => {
      const formation = this.config.formations[id];
      return formation.enabled && this.weight(id) > 0 && formation.minimumTier <= this.tier
        && this.elapsedMs - (this.lastUsed.get(id) ?? -Infinity) >= formation.cooldownMs;
    });
    const varied = eligible.filter((id) => !(id === this.lastFormation
      && this.consecutive >= this.config.formations[id].maxConsecutive));
    return varied.length ? varied : eligible;
  }

  reverse(): void {
    if (this.phase !== 'playing') return;
    this.direction = this.direction === 1 ? -1 : 1;
    this.reversals += 1;
  }

  clearProjectiles(): void {
    this.projectiles.length = 0; this.groupRemaining.clear();
  }

  update(deltaMs: number, orbitRadius: number, startDistance: number, random = Math.random): RunEvents {
    const events = this.events;
    events.collision = false; events.dodged = 0; events.reachedTier = 0;
    events.survivedFormations.length = 0;
    if (this.phase !== 'playing') return events;
    const delta = Math.min(this.config.maximumDeltaMs, Math.max(0, deltaMs));
    this.elapsedMs += delta;
    this.playerAngle += this.direction * this.config.playerAngularSpeed * delta / 1000;
    this.score = Math.max(0, Math.floor(this.elapsedMs / 1000 * this.config.scoreRate) + this.scoreOffset);
    if (this.tier > this.lastTier) { this.lastTier = this.tier; events.reachedTier = this.lastTier; }
    this.nextAttackMs -= delta;
    if (this.nextAttackMs <= 0) {
      const candidate = this.pickFormation(random);
      if (candidate && this.projectiles.length + this.config.formations[candidate].count <= this.config.projectile.simultaneousLimit) {
        this.fire(candidate, startDistance, random);
        this.nextAttackMs = this.attackIntervalMs;
      } else this.nextAttackMs = 150;
    }
    const playerX = Math.cos(this.playerAngle) * orbitRadius;
    const playerY = Math.sin(this.playerAngle) * orbitRadius;
    const radius = this.config.playerRadius + this.config.projectile.size * 0.72;
    for (let index = this.projectiles.length - 1; index >= 0; index -= 1) {
      const shot = this.projectiles[index];
      shot.ageMs += delta;
      if (shot.warningMs > 0) { shot.warningMs -= delta; continue; }
      const oldDistance = shot.distance;
      shot.distance -= shot.speed * delta / 1000;
      const dx = playerX - Math.cos(shot.angle) * shot.distance;
      const dy = playerY - Math.sin(shot.angle) * shot.distance;
      if (!shot.hit && dx * dx + dy * dy <= radius * radius) {
        shot.hit = true; this.collisionCount += 1; events.collision = true;
        if (!this.infiniteLives) { this.phase = 'game-over'; return events; }
      }
      if (!shot.crossed && oldDistance >= orbitRadius && shot.distance < orbitRadius) {
        shot.crossed = true;
        if (!shot.hit) events.dodged += 1;
        const group = this.groupRemaining.get(shot.group);
        if (group) {
          group.remaining -= 1;
          if (group.remaining <= 0) {
            if (!events.collision) events.survivedFormations.push(group.id);
            this.groupRemaining.delete(shot.group);
          }
        }
      }
      if (shot.distance < -this.config.projectile.size * 3 || shot.ageMs > this.config.projectile.lifetimeMs) {
        if (!shot.crossed) {
          const group = this.groupRemaining.get(shot.group);
          if (group) { group.remaining -= 1; if (group.remaining <= 0) this.groupRemaining.delete(shot.group); }
        }
        this.projectiles.splice(index, 1);
      }
    }
    return events;
  }

  fire(id: FormationId, startDistance: number, random = Math.random): boolean {
    const formation = this.config.formations[id];
    const center = random() * Math.PI * 2;
    const angles: number[] = [];
    const spread = id === 'bombardment'
      ? formation.arcRadians + ((formation.arcMaximum ?? formation.arcRadians) - formation.arcRadians)
        * Math.min(1, Math.max(0, (this.difficulty - this.config.difficulty.tierThresholds[4])
          / Math.max(0.01, this.config.difficulty.maximum - this.config.difficulty.tierThresholds[4])))
      : formation.arcRadians;
    const minimumSeparation = formation.minimumSeparation ?? 0.19;
    const count = Math.max(1, Math.min(formation.count, this.config.projectile.simultaneousLimit,
      id === 'bombardment' ? Math.floor(spread / minimumSeparation) + 1 : formation.count));
    if (this.projectiles.length + count > this.config.projectile.simultaneousLimit) return false;
    for (let index = 0; index < count; index += 1) {
      const position = id === 'line' && formation.sweepDirection === -1 ? count - 1 - index : index;
      let angle = id === 'double' || count === 1 ? center
        : center - spread / 2 + spread * position / (count - 1);
      if (id === 'bombardment' && count > 2 && index > 0 && index < count - 1) {
        const slack = Math.max(0, spread / (count - 1) - minimumSeparation);
        angle += (random() - 0.5) * slack * 0.5;
      }
      angles.push(angle);
    }
    const group = ++this.groupSequence;
    this.groupRemaining.set(group, { id, remaining: count });
    const speed = Math.min(this.config.projectile.speedMax,
      this.config.projectile.speedMin + (this.difficulty - 1) * 34) * formation.speedMultiplier;
    for (let index = 0; index < count; index += 1) {
      this.projectiles.push({ angle: angles[index], distance: startDistance,
        warningMs: Math.max(this.config.telegraph.minimumLeadMs, this.config.telegraph.leadMs)
          + this.config.telegraph.holdMs + this.config.telegraph.launchDelayMs + index * formation.intervalMs,
        ageMs: 0, speed, group, crossed: false, hit: false });
    }
    this.totalProjectiles += count; this.currentFormation = id;
    this.lastUsed.set(id, this.elapsedMs);
    this.consecutive = id === this.lastFormation ? this.consecutive + 1 : 1;
    this.lastFormation = id;
    this.nextFormation = this.pickFormation(random) ?? 'none';
    return true;
  }

  private pickFormation(random: () => number): FormationId | null {
    const pool = this.availableFormations();
    if (!pool.length) return null;
    const total = pool.reduce((sum, id) => sum + this.weight(id), 0);
    let roll = random() * total;
    for (const id of pool) {
      roll -= this.weight(id);
      if (roll <= 0) return id;
    }
    return pool[pool.length - 1];
  }

  private weight(id: FormationId): number {
    const formation = this.config.formations[id];
    return formation.weight * (formation.weightByTier[this.tier - 1] ?? 0);
  }
}
