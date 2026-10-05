import Phaser from 'phaser';
import { OrbitAudio } from './audio';
import { COLORS, createRuntimeConfig, type FormationId } from './config';
import { ProfileStore, type ThemeId } from './profile';
import { RunState } from './run';
import { OrbitUI } from './ui';
import { OrbitAdClient } from '../ads/OrbitAdClient';
import { OrbitAdFlow } from '../ads/OrbitAdFlow';
import { GameAdPlayer } from '../ads/GameAdPlayer';

const THEME_COLORS: Record<ThemeId, number> = {
  default: COLORS.cyan, water: 0x4fc9ff, nature: 0x8be779,
  fire: 0xffa34d, light: 0xffe7a2, chaos: 0xb88bff,
};

export class OrbitBreakScene extends Phaser.Scene {
  readonly config = createRuntimeConfig();
  readonly run = new RunState(this.config);
  readonly profile = new ProfileStore(this.config);
  readonly audio = new OrbitAudio(this.config);
  private ui!: OrbitUI;
  private centerX = 0;
  private centerY = 0;
  private orbitRadius = 120;
  private lastActionAt = -Infinity;
  private lastQuestSecond = 0;
  private lastProfileSaveMs = 0;
  private lastHudScore = -1;
  private reverseFlashMs = 0;
  private collisionFlashMs = 0;
  private background!: Phaser.GameObjects.Rectangle;
  private stars!: Phaser.GameObjects.Graphics;
  private arena!: Phaser.GameObjects.Graphics;
  private telegraphs!: Phaser.GameObjects.Graphics;
  private projectiles!: Phaser.GameObjects.Graphics;
  private player!: Phaser.GameObjects.Graphics;
  private status!: Phaser.GameObjects.Text;
  private hint!: Phaser.GameObjects.Text;
  private disposeDev: (() => void) | null = null;
  private alive = true;
  ads!: OrbitAdClient;
  adFlow!: OrbitAdFlow;
  private adPlayer: GameAdPlayer | null = null;
  private adSuspended = false;
  private priorFocus: HTMLElement | null = null;
  private presentationInitialized = false;

  constructor() { super('OrbitBreak'); }

  create(): void {
    this.alive = true;
    this.background = this.add.rectangle(0, 0, 1, 1, COLORS.background).setOrigin(0);
    this.stars = this.add.graphics();
    this.arena = this.add.graphics();
    this.telegraphs = this.add.graphics();
    this.projectiles = this.add.graphics();
    this.player = this.add.graphics();
    this.status = this.add.text(0, 0, 'BREAK THE PATTERN', {
      fontFamily: 'Segoe UI, sans-serif', fontSize: '15px', color: '#20e9ff',
      fontStyle: 'bold', letterSpacing: 3, align: 'center',
    }).setOrigin(0.5).setDepth(10);
    this.hint = this.add.text(0, 0, 'SPACE  /  CLICK  /  TAP', {
      fontFamily: 'Segoe UI, sans-serif', fontSize: '11px', color: '#8da1b3',
      letterSpacing: 2, align: 'center',
    }).setOrigin(0.5).setDepth(10);

    const parent = document.querySelector<HTMLElement>('#game');
    if (!parent) throw new Error('Orbit game root is missing.');
    this.ui = new OrbitUI(parent, this.profile, this.audio, {
      start: () => this.startGame(), revive: () => { void this.adFlow.revive(); },
      pause: () => this.pause(), resume: () => this.resume(), mainMenu: () => this.mainMenu(),
      notify: (message, levelUp) => this.ui.notify(message, levelUp),
      profileChanged: () => this.ui.refreshProfile(),
    });
    this.ads = new OrbitAdClient({
      origin: location.origin, source: window.parent,
      send: (message) => { if (window.parent !== window) window.parent.postMessage(message, location.origin); },
      suspend: (value) => this.suspendForAd(value), changed: () => this.refreshAds(),
      present: (payload, emit) => this.adPlayer?.play(payload, emit) ?? false,
      cancelPresentation: () => this.adPlayer?.cancel(),
      presentationReady: () => this.adPlayer !== null,
    });
    this.adFlow = new OrbitAdFlow(this.run, this.ads, {
      started: () => this.onRunStarted(), revived: () => {
        this.ui.setPhase('playing'); this.status.setText(''); this.hint.setText('SHIELD ACTIVE');
        this.ads.reportState('playing'); this.audio.startMusic();
      },
      finalized: () => {
        this.profile.recordFinishedRun(this.run.score); this.ui.refreshProfile();
      }, changed: () => this.refreshAds(),
    });
    window.addEventListener('message', this.onAdMessage);
    void this.mountAdPlayer(parent);
    this.input.on(Phaser.Input.Events.POINTER_DOWN, this.handleAction, this);
    window.addEventListener('keydown', this.onKeyDown);
    this.scale.on(Phaser.Scale.Events.RESIZE, this.handleResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);
    this.handleResize({ width: this.scale.width, height: this.scale.height });
    this.renderFrame(0);
    if (import.meta.env.DEV) {
      void import('../dev/orbit').then(({ mountOrbitDev }) => {
        if (this.alive) this.disposeDev = mountOrbitDev(this, parent);
      });
    }
  }

  update(time: number, delta: number): void {
    if (this.adSuspended) return;
    this.adFlow?.tick(delta);
    if (this.run.phase === 'playing') {
      const events = this.run.update(delta, this.orbitRadius, this.hazardStartDistance());
      if (this.run.protectionMs <= 0 && this.hint.text === 'SHIELD ACTIVE') this.hint.setText('REVERSE TO EVADE');
      const second = Math.floor(this.run.elapsedMs / 1000);
      if (second > this.lastQuestSecond) {
        const elapsed = second - this.lastQuestSecond;
        this.profile.addProgress('survive', elapsed);
        this.profile.addProgress('score', this.run.score, 'max');
        this.profile.addProgress('difficulty', Math.round(this.run.difficulty * 10) / 10, 'max');
        this.lastQuestSecond = second;
      }
      if (events.dodged) this.profile.addProgress('dodge', events.dodged);
      for (const id of events.survivedFormations) this.profile.formationSurvived(id);
      if (this.run.score !== this.lastHudScore) {
        this.lastHudScore = this.run.score;
        this.ui.updateScore(this.run.score);
      }
      if (this.run.elapsedMs - this.lastProfileSaveMs >= 5000) {
        this.lastProfileSaveMs = this.run.elapsedMs;
        this.profile.save();
      }
      if (events.collision) {
        this.collisionFlashMs = 170;
        if (!this.run.infiniteLives) this.endGame();
      }
    }
    const safeDelta = Math.min(delta, this.config.maximumDeltaMs);
    this.reverseFlashMs = Math.max(0, this.reverseFlashMs - safeDelta);
    this.collisionFlashMs = Math.max(0, this.collisionFlashMs - safeDelta);
    this.renderFrame(time);
  }

  startGame(): void {
    if (this.adSuspended || !this.adFlow) return;
    void this.audio.unlock();
    void this.adFlow.requestStartRun();
  }

  private onRunStarted(): void {
    this.lastQuestSecond = 0; this.lastProfileSaveMs = 0; this.lastHudScore = -1;
    this.ui.updateScore(0); this.ui.setPhase('playing');
    this.status.setText(''); this.hint.setText('REVERSE TO EVADE');
    this.audio.startCue();
    this.audio.startMusic(); this.ads.reportState('playing');
  }

  pause(): void {
    if (this.run.phase !== 'playing' || this.adSuspended || this.adFlow.pending) return;
    this.run.phase = 'paused'; this.ui.setPhase('paused'); this.audio.pauseMusic(); this.audio.uiCue();
    this.ads.reportState('paused');
  }

  resume(): void {
    if (this.run.phase !== 'paused' || this.adSuspended || this.adFlow.pending) return;
    this.run.phase = 'playing'; this.ui.setPhase('playing'); this.audio.startMusic(); this.audio.uiCue();
    this.ads.reportState('playing');
  }

  mainMenu(): void {
    if (this.adSuspended || !this.adFlow.menu()) return;
    this.audio.pauseMusic();
    this.ui.setPhase('menu'); this.ui.updateScore(0);
    this.status.setText('BREAK THE PATTERN').setColor('#20e9ff');
    this.hint.setText('SPACE  /  CLICK  /  TAP');
    this.ads.reportState('menu'); this.refreshAds();
  }

  forceDeath(): void {
    if (this.adSuspended || this.adFlow.pending) return;
    if (this.run.phase !== 'playing' && this.run.phase !== 'paused') return;
    this.run.phase = 'game-over'; this.endGame();
  }

  fireFormation(id: FormationId): boolean { return this.run.fire(id, this.hazardStartDistance()); }

  openPause(): void { this.pause(); this.ui.open('pause'); }
  refreshUI(): void { this.ui.refreshProfile(); this.ui.updateScore(this.run.score); }
  previewWhyAds(): void { this.ui.open('why-ads'); }

  get viewport(): { width: number; height: number } {
    return { width: this.scale.width, height: this.scale.height };
  }

  private endGame(): void {
    this.audio.pauseMusic();
    this.audio.deathCue();
    this.ui.setPhase('game-over'); this.ui.refreshProfile();
    this.status.setText(''); this.hint.setText('');
    this.adFlow.death(); this.ads.reportState('game-over');
  }

  private handleAction(): void {
    if (this.adSuspended || this.adFlow.pending || this.ui.isPanelOpen || this.run.phase === 'paused') return;
    const now = this.time.now;
    if (now - this.lastActionAt < this.config.inputDebounceMs) return;
    this.lastActionAt = now;
    void this.audio.unlock().then(() => { if (this.run.phase === 'playing') this.audio.startMusic(); });
    if (this.run.phase === 'playing') {
      this.run.reverse(); this.reverseFlashMs = 160;
      this.profile.addProgress('reverse', 1);
      this.profile.save();
      this.audio.reverseCue(this.run.direction);
    } else this.startGame();
  }

  private onKeyDown = (event: KeyboardEvent): void => {
    if (this.adSuspended || this.adFlow.pending) return;
    if (event.code !== 'Space' || event.repeat || event.ctrlKey || event.altKey || event.metaKey) return;
    if (event.target instanceof HTMLElement && event.target.closest('button, input, textarea, select')) return;
    event.preventDefault();
    this.handleAction();
  };

  private onAdMessage = (event: MessageEvent): void => {
    if (this.presentationInitialized) this.ads.receive(event);
  };

  private async mountAdPlayer(parent: HTMLElement): Promise<void> {
    if (import.meta.env.DEV) {
      try {
        const { createMockAdView } = await import('../ads/dev/MockAdView');
        if (!this.alive) return;
        this.adPlayer = new GameAdPlayer(createMockAdView(parent));
      } catch { /* Renderer unavailable: requests fail open through the bridge. */ }
    }
    if (this.alive) { this.presentationInitialized = true; this.ads.start(); }
  }

  private refreshAds(): void {
    if (!this.alive || !this.adFlow) return;
    this.ui.updateAds(this.ads.capabilities.fullscreenAvailable, this.adFlow.offer && this.ads.capabilities.rewardedAvailable,
      this.adFlow.offerMs / 1000, this.adFlow.pending || this.ads.busy);
    this.ui.setBlocked(this.adSuspended || this.adFlow.pending || this.ads.busy);
  }

  private suspendForAd(value: boolean): void {
    this.adSuspended = value; this.audio.suspendForAd(value);
    if (value) this.priorFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    this.input.enabled = !value;
    for (const element of document.querySelectorAll<HTMLElement>('#game > canvas, #game > .odesos-dev-panel')) element.inert = value;
    if (!value) {
      if (this.run.phase === 'playing') this.audio.startMusic();
      this.ui.setBlocked(false);
      if (this.priorFocus?.isConnected) this.priorFocus.focus({ preventScroll: true });
    }
    this.refreshAds();
  }

  private handleResize(gameSize: { width: number; height: number }): void {
    const width = Math.max(1, gameSize.width);
    const height = Math.max(1, gameSize.height);
    const top = Math.min(102, height * 0.29);
    const bottom = Math.min(68, height * 0.19);
    const available = Math.max(160, height - top - bottom);
    const previousRadius = this.orbitRadius;
    this.centerX = width / 2;
    this.centerY = top + available / 2;
    this.orbitRadius = Math.max(45, Math.min(width * this.config.orbitRadius,
      available * 0.45, this.config.maximumOrbitRadius));
    this.background.setSize(width, height);
    this.status.setPosition(this.centerX, this.centerY);
    this.hint.setPosition(this.centerX, Math.min(height - 40, this.centerY + this.orbitRadius + 25));
    this.stars.clear();
    for (let index = 0; index < 50; index += 1) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(0, height);
      this.stars.fillStyle(COLORS.white, Phaser.Math.FloatBetween(0.1, 0.3))
        .fillCircle(x, y, Phaser.Math.FloatBetween(0.3, 0.9));
    }
    for (const shot of this.run.projectiles) {
      if (shot.warningMs > 0) shot.distance = this.hazardStartDistance();
      else if (previousRadius > 0) shot.distance *= this.orbitRadius / previousRadius;
    }
  }

  private hazardStartDistance(): number { return this.orbitRadius + this.config.projectile.spawnDistance; }

  private renderFrame(time: number): void {
    const pulse = 0.5 + Math.sin(time * 0.004) * 0.5;
    this.arena.clear();
    const orbitTheme = this.profile.activeTheme('orbit');
    const planetTheme = this.profile.activeTheme('planet');
    const orbitColor = THEME_COLORS[orbitTheme];
    const planetColor = THEME_COLORS[planetTheme];
    this.arena.lineStyle(8, orbitColor, 0.07 + pulse * 0.02)
      .strokeCircle(this.centerX, this.centerY, this.orbitRadius);
    this.arena.lineStyle(1.5, orbitColor, 0.75)
      .strokeCircle(this.centerX, this.centerY, this.orbitRadius);
    this.drawSignature(this.arena, orbitTheme, this.centerX, this.centerY, this.orbitRadius, time, false);
    this.arena.fillStyle(planetColor, 0.08).fillCircle(this.centerX, this.centerY, 27 + pulse * 2);
    this.arena.fillStyle(planetColor, 0.9).fillCircle(this.centerX, this.centerY, 6);
    this.arena.fillStyle(COLORS.white, 0.9).fillCircle(this.centerX - 1, this.centerY - 1, 2);
    this.drawSignature(this.arena, planetTheme, this.centerX, this.centerY, 16, time, true);
    this.drawProjectiles(time);
    this.drawPlayer(time, pulse);
    if (this.collisionFlashMs > 0) {
      this.arena.lineStyle(2, COLORS.magenta, this.collisionFlashMs / 170 * 0.65)
        .strokeCircle(this.centerX, this.centerY, this.orbitRadius + 4);
    }
  }

  private drawSignature(graphics: Phaser.GameObjects.Graphics, theme: ThemeId,
    x: number, y: number, radius: number, time: number, planet: boolean): void {
    if (theme === 'default') return;
    const color = THEME_COLORS[theme];
    if (theme === 'water') {
      graphics.lineStyle(1, color, 0.16 + 0.13 * (Math.sin(time * 0.003) + 1) / 2)
        .strokeCircle(x, y, radius + 5 + Math.sin(time * 0.003) * 3);
    } else if (theme === 'nature') {
      graphics.fillStyle(color, 0.38);
      for (let index = 0; index < 3; index += 1) {
        const angle = time * 0.0005 + index * Math.PI * 2 / 3;
        graphics.fillCircle(x + Math.cos(angle) * (radius + 4), y + Math.sin(angle) * (radius + 4), planet ? 1.4 : 2);
      }
    } else if (theme === 'fire') {
      graphics.fillStyle(color, 0.24 + 0.14 * (Math.sin(time * 0.008) + 1) / 2)
        .fillCircle(x, y, planet ? radius + 5 : radius + 2);
    } else if (theme === 'light') {
      graphics.lineStyle(2, color, 0.18 + pulseFromTime(time) * 0.15)
        .strokeCircle(x, y, radius + 5);
    } else {
      graphics.lineStyle(1.5, color, 0.23)
        .strokeCircle(x + Math.sin(time * 0.002) * 2, y, radius + 3);
    }
  }

  private drawPlayer(time: number, pulse: number): void {
    const x = this.centerX + Math.cos(this.run.playerAngle) * this.orbitRadius;
    const y = this.centerY + Math.sin(this.run.playerAngle) * this.orbitRadius;
    const theme = this.profile.activeTheme('player');
    const color = THEME_COLORS[theme];
    this.player.clear();
    if (this.run.protectionMs > 0) this.player.lineStyle(2, COLORS.cyan, 0.7).strokeCircle(x, y, this.config.playerRadius + 7);
    this.player.fillStyle(color, 0.12 + this.reverseFlashMs / 160 * 0.18)
      .fillCircle(x, y, this.config.playerRadius * (2.1 + pulse * 0.2));
    this.player.fillStyle(COLORS.white, 1).fillCircle(x, y, this.config.playerRadius);
    this.player.fillStyle(color, 1).fillCircle(x, y, this.config.playerRadius * 0.44);
    if (this.reverseFlashMs > 0) this.player.lineStyle(1.5, color, this.reverseFlashMs / 160).strokeCircle(x, y, 14);
    if (theme !== 'default') this.drawSignature(this.player, theme, x, y, 13, time, true);
  }

  private drawProjectiles(time: number): void {
    this.telegraphs.clear(); this.projectiles.clear();
    const theme = this.profile.activeTheme('projectile');
    const color = theme === 'default' ? COLORS.magenta : THEME_COLORS[theme];
    for (const shot of this.run.projectiles) {
      const cosine = Math.cos(shot.angle), sine = Math.sin(shot.angle);
      if (shot.warningMs > 0) {
        const markerX = this.centerX + cosine * this.orbitRadius;
        const markerY = this.centerY + sine * this.orbitRadius;
        const elapsed = Math.max(0, this.config.telegraph.leadMs - shot.warningMs);
        const ping = Math.floor(elapsed / this.config.telegraph.pingIntervalMs);
        const pingVisible = ping < this.config.telegraph.pingCount;
        const flash = pingVisible ? 0.4 + 0.25 * Math.sin(time * 0.018) : 0.46;
        const alpha = Math.max(0.35, Math.min(1, this.config.telegraph.opacity * flash));
        this.telegraphs.lineStyle(1, color, alpha * 0.45)
          .lineBetween(this.centerX + cosine * 18, this.centerY + sine * 18,
            this.centerX + cosine * shot.distance, this.centerY + sine * shot.distance);
        this.telegraphs.lineStyle(2, color, alpha)
          .strokeCircle(markerX, markerY, (pingVisible ? 10 + ping * 3 : 16) * this.config.telegraph.scale);
        this.telegraphs.fillStyle(color, alpha).fillCircle(markerX, markerY, 3.5);
        continue;
      }
      const x = this.centerX + cosine * shot.distance;
      const y = this.centerY + sine * shot.distance;
      const size = this.config.projectile.size;
      const sideX = -sine * size * 0.58, sideY = cosine * size * 0.58;
      const frontX = x - cosine * size, frontY = y - sine * size;
      const backX = x + cosine * size, backY = y + sine * size;
      this.projectiles.lineStyle(4, color, 0.22)
        .lineBetween(backX + cosine * size * 1.5, backY + sine * size * 1.5, x, y);
      this.projectiles.fillStyle(color, 0.16).fillCircle(x, y, size * 1.5);
      this.projectiles.fillStyle(color, 0.95)
        .fillTriangle(frontX, frontY, x + sideX, y + sideY, backX, backY)
        .fillTriangle(frontX, frontY, backX, backY, x - sideX, y - sideY);
      this.projectiles.fillStyle(COLORS.white, 0.8).fillCircle(x, y, 2);
    }
  }

  private shutdown(): void {
    this.alive = false;
    this.adFlow.destroy(); this.ads.destroy(); this.adPlayer?.destroy();
    window.removeEventListener('message', this.onAdMessage);
    this.input.off(Phaser.Input.Events.POINTER_DOWN, this.handleAction, this);
    window.removeEventListener('keydown', this.onKeyDown);
    this.scale.off(Phaser.Scale.Events.RESIZE, this.handleResize, this);
    this.disposeDev?.();
    this.ui.destroy(); this.audio.destroy(); this.run.clearProjectiles();
  }
}

function pulseFromTime(time: number): number { return (Math.sin(time * 0.004) + 1) / 2; }
