import Phaser from 'phaser';
import type { LocationId } from './model';

/** One presentation scene, with location as data. Only one background texture retained. */
export class FacilityScene extends Phaser.Scene {
  private location: LocationId = 'operations';
  private anomaly = false;
  private reducedMotion = false;
  private pulse?: Phaser.GameObjects.Graphics;
  constructor() { super('facility'); }
  init(data: { location?: LocationId; anomaly?: boolean }) {
    this.location = data.location ?? 'operations';
    this.anomaly = data.anomaly ?? false;
    this.reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  preload() {
    if (this.textures.exists('background')) this.textures.remove('background');
    this.load.svg('background', `${import.meta.env.BASE_URL}art/${this.location}.svg`, { width: 1440, height: 810 });
  }
  create() {
    if (this.textures.exists('background')) this.add.image(720, 405, 'background');
    else this.add.text(720, 405, 'Scene unavailable. Narrative controls remain available.', { fontSize: '22px', color: '#c1d5d3' }).setOrigin(.5);
    this.pulse = this.add.graphics();
    if (this.anomaly || this.location === 'sublevel') {
      const [x, y] = this.location === 'sublevel' ? [712, 352] : this.location === 'archive' ? [721, 276] : this.location === 'yard' ? [893, 571] : [771, 426];
      this.pulse.lineStyle(2, 0xc6a9ef, .8);
      for (let i = 0; i < 7; i++) this.pulse.lineBetween(x - 20 + i * 6, y - (i % 3 + 1) * 8, x - 20 + i * 6, y + (i % 3 + 1) * 8);
      if (!this.reducedMotion) this.tweens.add({ targets: this.pulse, alpha: .18, duration: 1800, yoyo: true, repeat: -1, hold: 1300, ease: 'Sine.easeInOut' });
    }
    const light = this.add.rectangle(1167, 309, 5, 5, 0xd5b98a, .6);
    if (this.location !== 'operations') light.setVisible(false);
    if (!this.reducedMotion) this.time.addEvent({ delay: 8200, loop: true, callback: () => this.tweens.add({ targets: light, alpha: .1, duration: 100, yoyo: true, repeat: 1 }) });
    this.game.events.emit('room-ready');
  }
  signal() {
    if (!this.pulse || this.reducedMotion) return;
    this.tweens.add({ targets: this.pulse, x: 3, duration: 65, yoyo: true, repeat: 2 });
  }
}

export class Presentation {
  private readonly game: Phaser.Game;
  private current: LocationId = 'operations';
  constructor(parent: string) {
    this.game = new Phaser.Game({
      type: Phaser.AUTO, parent, width: 1440, height: 810, backgroundColor: '#10212a',
      scene: [FacilityScene], render: { antialias: true, pixelArt: false },
      scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
      fps: { target: 30 }, audio: { noAudio: true }, banner: false,
    });
  }
  async show(location: LocationId, anomaly: boolean, force = false): Promise<void> {
    if (location === this.current && !force) return;
    this.current = location;
    return new Promise(resolve => {
      this.game.events.once('room-ready', resolve);
      this.game.scene.start('facility', { location, anomaly });
    });
  }
  signal(): void { (this.game.scene.getScene('facility') as FacilityScene).signal(); }
}
