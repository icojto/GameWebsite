import Phaser from 'phaser';
import './style.css';
import { OrbitBreakScene } from './game/OrbitBreakScene';

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#05070d',
  scene: [OrbitBreakScene],
  scale: {
    mode: Phaser.Scale.RESIZE,
    width: '100%',
    height: '100%',
  },
  render: {
    antialias: true,
    pixelArt: false,
    roundPixels: false,
  },
  input: {
    activePointers: 2,
  },
});

window.addEventListener('beforeunload', () => game.destroy(true), { once: true });
