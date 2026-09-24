import Phaser from "phaser";
import { CONFIG, MODULE_IDS } from "../game/config.ts";
import type { ModuleId, Resource } from "../game/config.ts";
import { newScenario } from "../game/simulation.ts";
import type { Scenario } from "../game/simulation.ts";

const centers: Record<ModuleId, [number, number]> = {
  reactor: [165, 145],
  oxygen: [555, 145],
  hydroponics: [165, 385],
  support: [555, 385],
};
const palette: Record<Resource, number> = {
  energy: 0xeac775,
  oxygen: 0x89d9ec,
  food: 0x9acda2,
  credits: 0xd1b49a,
};
export class StationScene extends Phaser.Scene {
  private art!: Phaser.GameObjects.Graphics;
  private fx!: Phaser.GameObjects.Graphics;
  private dataState = newScenario();
  private resolving = false;
  private reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  constructor() {
    super("station");
  }
  create() {
    this.art = this.add.graphics();
    this.fx = this.add.graphics();
    this.draw();
    this.events.on("shutdown", () => this.tweens.killAll());
  }
  present(state: Scenario, resolving: boolean) {
    const changed = JSON.stringify(state) !== JSON.stringify(this.dataState);
    this.dataState = state;
    this.resolving = resolving;
    if (!this.art) return;
    this.draw();
    if (changed && !this.reduced) {
      this.tweens.killTweensOf(this.art);
      this.art.alpha = 0.55;
      this.tweens.add({
        targets: this.art,
        alpha: 1,
        duration: CONFIG.feedback.pulseMs,
      });
    }
  }
  private draw() {
    const g = this.art;
    g.clear();
    // Fixed decorative star positions keep presentation independent of simulation.
    for (let i = 0; i < 72; i++) {
      const x = (i * 173 + 31) % 720,
        y = (i * 97 + 13) % 550;
      g.fillStyle(0x98bacf, i % 5 === 0 ? 0.5 : 0.19);
      g.fillCircle(x, y, i % 7 === 0 ? 1.2 : 0.7);
    }
    g.lineStyle(1, 0x234254, 0.45);
    g.strokeCircle(360, 265, 210);
    g.strokeCircle(360, 265, 203);
    g.lineStyle(1, 0x355162, 0.4);
    for (let x = 30; x < 720; x += 30) {
      g.lineBetween(x, 0, x, 5);
      g.lineBetween(x, 545, x, 550);
    }
    for (const id of MODULE_IDS) {
      const [x, y] = centers[id];
      // Pressurized truss with a bright service spine.
      g.lineStyle(25, 0x0a121d);
      g.lineBetween(360, 265, x, y);
      g.lineStyle(19, 0x344553);
      g.lineBetween(360, 265, x, y);
      g.lineStyle(13, 0x182839);
      g.lineBetween(360, 265, x, y);
      g.lineStyle(2, 0x81b2b7, 0.6);
      g.lineBetween(360, 265, x, y);
      for (let t = 0.2; t < 0.85; t += 0.14) {
        const px = 360 + (x - 360) * t,
          py = 265 + (y - 265) * t;
        g.lineStyle(2, 0x516373);
        g.lineBetween(px - 5, py - 8, px + 5, py + 8);
      }
      const mod = CONFIG.modules[id],
        value = this.dataState.resources[mod.resource];
      const color =
        id !== "support" && value <= CONFIG.criticalThreshold
          ? 0xee825f
          : palette[mod.resource];
      const staffed = Object.values(this.dataState.assignments).includes(id);
      // Solar fins / service panels flank each module.
      for (const side of [-1, 1]) {
        g.fillStyle(0x152c40);
        g.fillRect(x + side * 102 - 22, y - 32, 44, 64);
        g.lineStyle(1, 0x527088, 0.65);
        g.strokeRect(x + side * 102 - 22, y - 32, 44, 64);
        for (let n = 1; n < 4; n++)
          g.lineBetween(
            x + side * 102 - 22,
            y - 32 + n * 16,
            x + side * 102 + 22,
            y - 32 + n * 16,
          );
        g.lineBetween(x + side * 102, y - 32, x + side * 102, y + 32);
      }
      g.fillStyle(0x09121d);
      g.fillRoundedRect(x - 82, y - 64, 164, 128, 17);
      g.fillStyle(0x243544);
      g.fillRoundedRect(x - 77, y - 59, 154, 118, 14);
      g.lineStyle(2, color, staffed ? 0.8 : 0.3);
      g.strokeRoundedRect(x - 77, y - 59, 154, 118, 14);
      g.fillStyle(0x101f2e);
      g.fillRoundedRect(x - 68, y - 50, 136, 100, 10);
      g.lineStyle(1, 0x6a7e8d, 0.45);
      g.strokeRoundedRect(x - 66, y - 48, 132, 96, 10);
      g.fillStyle(color, staffed ? 0.8 : 0.2);
      g.fillRect(x - 41, y - 56, 82, 3);
      if (id === "reactor") {
        for (let r = 31; r > 10; r -= 9) {
          g.lineStyle(3, color, 0.5);
          g.strokeCircle(x, y, r);
        }
        g.fillStyle(color, 0.8);
        g.fillCircle(x, y, 9);
        for (let k = 0; k < 8; k++) {
          const a = (k * Math.PI) / 4;
          g.lineStyle(3, 0x66798a);
          g.lineBetween(
            x + Math.cos(a) * 36,
            y + Math.sin(a) * 36,
            x + Math.cos(a) * 44,
            y + Math.sin(a) * 44,
          );
        }
      } else if (id === "oxygen") {
        for (const offset of [-26, 0, 26]) {
          g.fillStyle(0x2c5362);
          g.fillRoundedRect(x + offset - 9, y - 31, 18, 62, 8);
          g.lineStyle(2, color, 0.8);
          g.strokeRoundedRect(x + offset - 9, y - 31, 18, 62, 8);
          g.lineBetween(x + offset - 8, y + 13, x + offset + 8, y + 13);
        }
      } else if (id === "hydroponics") {
        for (let row = 0; row < 3; row++)
          for (let col = 0; col < 5; col++) {
            g.fillStyle(color, value > 15 ? 0.65 : 0.2);
            g.fillRoundedRect(x - 48 + col * 21, y - 29 + row * 23, 15, 16, 4);
          }
      } else {
        g.lineStyle(2, color, 0.65);
        g.strokeRect(x - 37, y - 28, 32, 51);
        g.strokeRect(x + 5, y - 28, 32, 51);
        for (let n = 0; n < 3; n++) {
          g.fillStyle(color, 0.35);
          g.fillRect(x - 31, y - 21 + n * 16, 20, 8);
          g.fillRect(x + 11, y - 21 + n * 16, 20, 8);
        }
      }
      for (const side of [-1, 1]) {
        g.fillStyle(0x92b6bd, 0.65);
        g.fillCircle(x + side * 65, y + 46, 2);
      }
    }
    const collapsed = this.dataState.outcome === "COLLAPSE",
      rescued = this.dataState.outcome === "RESCUE";
    const coreColor = collapsed ? 0xe4775d : rescued ? 0xc8f5dd : 0x95cbd0;
    g.fillStyle(0x0b1724);
    g.fillCircle(360, 265, 67);
    g.lineStyle(2, 0x496474);
    g.strokeCircle(360, 265, 67);
    g.fillStyle(0x263d4c);
    g.fillCircle(360, 265, 53);
    g.lineStyle(2, coreColor, 0.8);
    g.strokeCircle(360, 265, 53);
    g.fillStyle(0x102231);
    g.fillCircle(360, 265, 44);
    g.lineStyle(1, coreColor, 0.4);
    g.strokeCircle(360, 265, 37);
    g.lineStyle(2, coreColor, 0.6);
    g.lineBetween(330, 265, 390, 265);
    g.lineBetween(360, 235, 360, 295);
    g.fillStyle(coreColor);
    g.fillCircle(360, 265, 8);
    if (rescued) {
      g.lineStyle(7, coreColor, 0.15);
      g.strokeCircle(360, 265, 80);
    }
    if (collapsed) {
      g.lineStyle(2, 0xf9af74);
      for (let i = 0; i < 8; i++) {
        const x = 340 + ((i * 31) % 56),
          y = 245 + ((i * 19) % 40);
        g.lineBetween(x, y, x + 6, y - 9);
      }
    }
  }
  update(time: number) {
    if (!this.fx) return;
    this.fx.clear();
    const alpha = this.reduced ? 0.45 : 0.23 + (Math.sin(time / 700) + 1) * 0.2;
    for (const id of MODULE_IDS) {
      const mod = CONFIG.modules[id];
      if (
        id !== "support" &&
        this.dataState.resources[mod.resource] <= CONFIG.criticalThreshold
      ) {
        const [x, y] = centers[id];
        this.fx.lineStyle(3, 0xee825f, alpha);
        this.fx.strokeRoundedRect(x - 82, y - 64, 164, 128, 17);
      }
    }
    if (this.resolving) {
      this.fx.lineStyle(3, 0xb4eded, alpha);
      this.fx.strokeCircle(360, 265, 78);
    }
  }
}
export function createStation(parent: string): StationScene {
  const scene = new StationScene();
  new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: 720,
    height: 550,
    transparent: true,
    scene,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    render: { antialias: true },
    fps: { target: 30 },
    audio: { noAudio: true },
    banner: false,
  });
  return scene;
}
