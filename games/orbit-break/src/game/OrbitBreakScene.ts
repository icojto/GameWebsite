import Phaser from 'phaser';
import { OrbitAudio } from './audio';
import { COLORS, GAME_CONFIG } from './config';

enum GameState {
  START,
  PLAYING,
  GAME_OVER,
}

interface Hazard {
  angle: number;
  distance: number;
  warningLeft: number;
  speed: number;
  active: boolean;
}

const BEST_SCORE_KEY = 'orbitBreak.bestScore';

export class OrbitBreakScene extends Phaser.Scene {
  private state = GameState.START;
  private centerX = 0;
  private centerY = 0;
  private orbitRadius = 120;
  private playerAngle = -Math.PI / 2;
  private direction: 1 | -1 = 1;
  private elapsedMs = 0;
  private nextSpawnInMs = 0;
  private lastActionAt = -Infinity;
  private score = 0;
  private bestScore = 0;
  private lastHazardAngle = 0;
  private hazards: Hazard[] = [];

  private background!: Phaser.GameObjects.Rectangle;
  private starGraphics!: Phaser.GameObjects.Graphics;
  private arenaGraphics!: Phaser.GameObjects.Graphics;
  private hazardGraphics!: Phaser.GameObjects.Graphics;
  private playerGraphics!: Phaser.GameObjects.Graphics;
  private titleText!: Phaser.GameObjects.Text;
  private scoreText!: Phaser.GameObjects.Text;
  private bestText!: Phaser.GameObjects.Text;
  private statusText!: Phaser.GameObjects.Text;
  private hintText!: Phaser.GameObjects.Text;
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private readonly audio = new OrbitAudio();

  constructor() {
    super('OrbitBreak');
  }

  create(): void {
    this.bestScore = this.loadBestScore();
    this.background = this.add.rectangle(0, 0, 1, 1, COLORS.background).setOrigin(0);
    this.starGraphics = this.add.graphics();
    this.arenaGraphics = this.add.graphics();
    this.hazardGraphics = this.add.graphics();
    this.playerGraphics = this.add.graphics();

    const uiStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: 'Segoe UI, Inter, sans-serif',
      color: COLORS.bright,
    };
    this.titleText = this.add.text(0, 0, 'ORBIT BREAK', {
      ...uiStyle,
      fontSize: '18px',
      fontStyle: 'bold',
      letterSpacing: 5,
    }).setOrigin(0.5).setDepth(10);
    this.scoreText = this.add.text(0, 0, '000000', {
      ...uiStyle,
      fontSize: '24px',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0).setDepth(10);
    this.bestText = this.add.text(0, 0, `BEST ${this.formatScore(this.bestScore)}`, {
      ...uiStyle,
      color: COLORS.muted,
      fontSize: '12px',
      letterSpacing: 2,
    }).setOrigin(0.5, 0).setDepth(10);
    this.statusText = this.add.text(0, 0, 'BREAK THE PATTERN', {
      ...uiStyle,
      color: COLORS.cyanCss,
      fontSize: '15px',
      fontStyle: 'bold',
      letterSpacing: 3,
      align: 'center',
    }).setOrigin(0.5).setDepth(10);
    this.hintText = this.add.text(0, 0, 'SPACE  /  CLICK  /  TAP', {
      ...uiStyle,
      color: COLORS.muted,
      fontSize: '12px',
      letterSpacing: 2,
      align: 'center',
    }).setOrigin(0.5).setDepth(10);

    this.spaceKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.input.on(Phaser.Input.Events.POINTER_DOWN, this.handleAction, this);
    this.scale.on(Phaser.Scale.Events.RESIZE, this.handleResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);

    this.handleResize({ width: this.scale.width, height: this.scale.height });
    this.renderFrame(0);
  }

  update(time: number, delta: number): void {
    if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      this.handleAction();
    }

    const safeDelta = Math.min(delta, GAME_CONFIG.maximumDeltaMs);
    if (this.state === GameState.PLAYING) {
      this.updatePlaying(safeDelta);
    }
    this.renderFrame(time);
  }

  private handleAction(): void {
    const now = this.time.now;
    if (now - this.lastActionAt < GAME_CONFIG.inputDebounceMs) return;
    this.lastActionAt = now;

    void this.audio.unlock().then(() => this.audio.startMusic());

    if (this.state === GameState.PLAYING) {
      this.direction = this.direction === 1 ? -1 : 1;
      this.audio.reverseCue(this.direction);
      return;
    }

    this.startGame();
  }

  private startGame(): void {
    this.state = GameState.PLAYING;
    this.playerAngle = -Math.PI / 2;
    this.direction = 1;
    this.elapsedMs = 0;
    this.score = 0;
    this.nextSpawnInMs = 650;
    this.hazards.length = 0;
    this.statusText.setText('');
    this.hintText.setText('REVERSE TO EVADE');
    this.audio.startCue();
  }

  private updatePlaying(delta: number): void {
    const deltaSeconds = delta / 1000;
    this.elapsedMs += delta;
    this.playerAngle += this.direction * GAME_CONFIG.playerAngularSpeed * deltaSeconds;
    this.score = Math.floor((this.elapsedMs / 1000) * GAME_CONFIG.scoreRate);
    this.scoreText.setText(this.formatScore(this.score));

    this.nextSpawnInMs -= delta;
    if (this.nextSpawnInMs <= 0 && this.hazards.length < GAME_CONFIG.maximumActiveHazards) {
      this.spawnHazard();
      this.nextSpawnInMs += this.currentSpawnInterval();
    }

    const playerX = this.centerX + Math.cos(this.playerAngle) * this.orbitRadius;
    const playerY = this.centerY + Math.sin(this.playerAngle) * this.orbitRadius;

    for (let index = this.hazards.length - 1; index >= 0; index -= 1) {
      const hazard = this.hazards[index];
      if (!hazard.active) {
        hazard.warningLeft -= delta;
        if (hazard.warningLeft <= 0) hazard.active = true;
        continue;
      }

      hazard.distance -= hazard.speed * deltaSeconds;
      const hazardX = this.centerX + Math.cos(hazard.angle) * hazard.distance;
      const hazardY = this.centerY + Math.sin(hazard.angle) * hazard.distance;
      const dx = playerX - hazardX;
      const dy = playerY - hazardY;
      const collisionRadius = GAME_CONFIG.playerRadius + GAME_CONFIG.hazardSize * 0.72;
      if (dx * dx + dy * dy <= collisionRadius * collisionRadius) {
        this.endGame();
        return;
      }

      if (hazard.distance < -GAME_CONFIG.hazardSize * 3) {
        this.hazards.splice(index, 1);
      }
    }
  }

  private spawnHazard(): void {
    let angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const minimumSeparation = 0.55;
    if (Math.abs(Phaser.Math.Angle.Wrap(angle - this.lastHazardAngle)) < minimumSeparation) {
      angle = Phaser.Math.Angle.Wrap(angle + Math.PI * 0.72);
    }
    this.lastHazardAngle = angle;

    const difficulty = 1 + (this.elapsedMs / 1000) * GAME_CONFIG.difficultyRampRate;
    const speed = Math.min(
      GAME_CONFIG.maximumHazardSpeed,
      GAME_CONFIG.hazardSpeed * difficulty,
    );
    this.hazards.push({
      angle,
      distance: this.hazardStartDistance(),
      warningLeft: GAME_CONFIG.warningDuration,
      speed,
      active: false,
    });
  }

  private currentSpawnInterval(): number {
    const difficulty = 1 + (this.elapsedMs / 1000) * GAME_CONFIG.difficultyRampRate;
    return Math.max(
      GAME_CONFIG.minimumHazardSpawnInterval,
      GAME_CONFIG.hazardSpawnInterval / difficulty,
    );
  }

  private endGame(): void {
    if (this.state !== GameState.PLAYING) return;
    this.state = GameState.GAME_OVER;
    this.audio.deathCue();
    if (this.score > this.bestScore) {
      this.bestScore = this.score;
      this.saveBestScore(this.bestScore);
      this.bestText.setText(`BEST ${this.formatScore(this.bestScore)}`);
    }
    this.statusText.setText(`SIGNAL LOST\n${this.formatScore(this.score)}`).setColor(COLORS.magentaCss);
    this.hintText.setText('SPACE  /  CLICK  /  TAP TO RESTART');
  }

  private handleResize(gameSize: { width: number; height: number }): void {
    const width = Math.max(1, gameSize.width);
    const height = Math.max(1, gameSize.height);
    const smaller = Math.min(width, height);
    const isLandscape = width > height;
    this.centerX = width / 2;
    this.centerY = height / 2 + Math.min(isLandscape ? 36 : 30, height * (isLandscape ? 0.08 : 0.035));
    this.orbitRadius = Phaser.Math.Clamp(
      smaller * GAME_CONFIG.orbitRadius,
      Math.min(GAME_CONFIG.minimumOrbitRadius, smaller * 0.31),
      GAME_CONFIG.maximumOrbitRadius,
    );

    this.background.setSize(width, height);
    this.titleText.setPosition(this.centerX, Math.max(30, height * 0.07));
    this.scoreText.setPosition(this.centerX, Math.max(54, height * 0.105));
    this.bestText.setPosition(this.centerX, Math.max(84, height * 0.155));
    this.statusText.setPosition(this.centerX, this.centerY);
    this.hintText.setPosition(this.centerX, Math.min(height - 30, this.centerY + this.orbitRadius + 66));
    this.rebuildStars(width, height);

    for (const hazard of this.hazards) {
      if (!hazard.active) hazard.distance = this.hazardStartDistance();
    }
  }

  private rebuildStars(width: number, height: number): void {
    this.starGraphics.clear();
    for (let index = 0; index < 54; index += 1) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(0, height);
      const alpha = Phaser.Math.FloatBetween(0.12, 0.42);
      const radius = Phaser.Math.FloatBetween(0.35, 1.1);
      this.starGraphics.fillStyle(COLORS.white, alpha).fillCircle(x, y, radius);
    }
  }

  private renderFrame(time: number): void {
    const pulse = 0.5 + Math.sin(time * 0.004) * 0.5;
    this.arenaGraphics.clear();
    this.arenaGraphics.lineStyle(8, COLORS.cyanSoft, 0.045 + pulse * 0.025);
    this.arenaGraphics.strokeCircle(this.centerX, this.centerY, this.orbitRadius);
    this.arenaGraphics.lineStyle(1.5, COLORS.cyan, 0.62);
    this.arenaGraphics.strokeCircle(this.centerX, this.centerY, this.orbitRadius);
    this.arenaGraphics.fillStyle(COLORS.cyan, 0.06 + pulse * 0.04);
    this.arenaGraphics.fillCircle(this.centerX, this.centerY, 26 + pulse * 4);
    this.arenaGraphics.fillStyle(COLORS.white, 0.92);
    this.arenaGraphics.fillCircle(this.centerX, this.centerY, 4.5);
    this.arenaGraphics.lineStyle(1, COLORS.cyan, 0.26);
    this.arenaGraphics.strokeCircle(this.centerX, this.centerY, 12 + pulse * 2);

    this.drawHazards(time);
    this.drawPlayer(pulse);
  }

  private drawPlayer(pulse: number): void {
    const x = this.centerX + Math.cos(this.playerAngle) * this.orbitRadius;
    const y = this.centerY + Math.sin(this.playerAngle) * this.orbitRadius;
    this.playerGraphics.clear();
    this.playerGraphics.fillStyle(COLORS.cyan, 0.13);
    this.playerGraphics.fillCircle(x, y, GAME_CONFIG.playerRadius * (2.1 + pulse * 0.2));
    this.playerGraphics.fillStyle(COLORS.white, 1);
    this.playerGraphics.fillCircle(x, y, GAME_CONFIG.playerRadius);
    this.playerGraphics.fillStyle(COLORS.cyan, 1);
    this.playerGraphics.fillCircle(x, y, GAME_CONFIG.playerRadius * 0.43);
  }

  private drawHazards(time: number): void {
    this.hazardGraphics.clear();
    for (const hazard of this.hazards) {
      const cosine = Math.cos(hazard.angle);
      const sine = Math.sin(hazard.angle);
      if (!hazard.active) {
        const progress = 1 - Math.max(0, hazard.warningLeft) / GAME_CONFIG.warningDuration;
        const markerX = this.centerX + cosine * this.orbitRadius;
        const markerY = this.centerY + sine * this.orbitRadius;
        const flash = 0.42 + Math.sin(time * 0.018) * 0.26;
        this.hazardGraphics.lineStyle(1, COLORS.magenta, 0.12 + progress * 0.25);
        this.hazardGraphics.lineBetween(
          this.centerX + cosine * 20,
          this.centerY + sine * 20,
          this.centerX + cosine * hazard.distance,
          this.centerY + sine * hazard.distance,
        );
        this.hazardGraphics.lineStyle(2, COLORS.magenta, flash);
        this.hazardGraphics.strokeCircle(markerX, markerY, 10 + progress * 8);
        this.hazardGraphics.fillStyle(COLORS.magenta, 0.25 + progress * 0.4);
        this.hazardGraphics.fillCircle(markerX, markerY, 3.5);
        continue;
      }

      const x = this.centerX + cosine * hazard.distance;
      const y = this.centerY + sine * hazard.distance;
      const size = GAME_CONFIG.hazardSize;
      const sideX = -sine * size * 0.58;
      const sideY = cosine * size * 0.58;
      const frontX = x - cosine * size;
      const frontY = y - sine * size;
      const backX = x + cosine * size;
      const backY = y + sine * size;
      this.hazardGraphics.lineStyle(5, COLORS.magentaSoft, 0.19);
      this.hazardGraphics.lineBetween(backX + cosine * size * 2.2, backY + sine * size * 2.2, x, y);
      this.hazardGraphics.fillStyle(COLORS.magenta, 0.14);
      this.hazardGraphics.fillCircle(x, y, size * 1.65);
      this.hazardGraphics.fillStyle(COLORS.magenta, 0.95);
      this.hazardGraphics.fillTriangle(frontX, frontY, x + sideX, y + sideY, backX, backY);
      this.hazardGraphics.fillTriangle(frontX, frontY, backX, backY, x - sideX, y - sideY);
      this.hazardGraphics.fillStyle(COLORS.white, 0.88);
      this.hazardGraphics.fillCircle(x, y, 2.2);
    }
  }

  private hazardStartDistance(): number {
    const farEdge = Math.hypot(this.scale.width, this.scale.height) * 0.54;
    return Math.max(farEdge, this.orbitRadius + GAME_CONFIG.hazardSpawnDistance);
  }

  private loadBestScore(): number {
    try {
      const stored = window.localStorage.getItem(BEST_SCORE_KEY);
      const parsed = stored ? Number.parseInt(stored, 10) : 0;
      return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
    } catch {
      return this.bestScore;
    }
  }

  private saveBestScore(score: number): void {
    try {
      window.localStorage.setItem(BEST_SCORE_KEY, String(score));
    } catch {
      // The in-memory best score remains available for this session.
    }
  }

  private formatScore(score: number): string {
    return Math.max(0, score).toString().padStart(6, '0');
  }

  private shutdown(): void {
    this.input.off(Phaser.Input.Events.POINTER_DOWN, this.handleAction, this);
    this.scale.off(Phaser.Scale.Events.RESIZE, this.handleResize, this);
    this.audio.destroy();
    this.hazards.length = 0;
  }
}
