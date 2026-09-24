import { config as c } from './config.ts';
export function cellAt(x: number, y: number, left: number, top: number, size: number): number | null {
  const col = Math.floor((x - left) / size), row = Math.floor((y - top) / size);
  return col >= 0 && col < c.gridWidth && row >= 0 && row < c.gridHeight ? row * c.gridWidth + col : null;
}
// Phaser supplies the same logical coordinates for mouse and touch.
export class Gesture {
  selected: number | null = null;
  down: number | null = null;
  pointer: number | null = null;
  reset() { this.selected = this.down = this.pointer = null; }
  begin(cell: number | null, pointer: number) { if (this.pointer === null) { this.down = cell; this.pointer = pointer; } }
  end(cell: number | null, pointer: number): [number, number] | null {
    if (pointer !== this.pointer) return null;
    const down = this.down; this.down = this.pointer = null;
    if (down === null || cell === null) { this.selected = null; return null; }
    if (down !== cell) { this.selected = null; return [down, cell]; }
    if (this.selected !== null && this.selected !== cell) { const from = this.selected; this.selected = null; return [from, cell]; }
    this.selected = this.selected === cell ? null : cell; return null;
  }
}
