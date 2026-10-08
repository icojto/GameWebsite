import { DEFAULT_CONFIG, type RuntimeConfig } from './config.ts';
export function cellAt(x: number, y: number, left: number, top: number, size: number, config: RuntimeConfig = DEFAULT_CONFIG): number | null {
  const col = Math.floor((x - left) / size), row = Math.floor((y - top) / size);
  return col >= 0 && col < config.gridWidth && row >= 0 && row < config.gridHeight ? row * config.gridWidth + col : null;
}
export type SwipeDirection = 'left' | 'right' | 'up' | 'down';
export type SwipePreview = { from: number; to: number | null; direction: SwipeDirection };
// A swipe chooses one adjacent cell from its first clear cardinal movement.
export class Gesture {
  selected: number | null = null;
  down: number | null = null;
  pointer: number | null = null;
  preview: SwipePreview | null = null;
  private origin: { x: number; y: number } | null = null;
  cancelPointer() { this.down = this.pointer = null; this.preview = null; this.origin = null; }
  reset() { this.selected = null; this.cancelPointer(); }
  begin(cell: number | null, pointer: number, x?: number, y?: number) {
    if (this.pointer !== null) return;
    this.down = cell; this.pointer = pointer;
    this.origin = x === undefined || y === undefined ? null : { x, y };
    this.preview = null;
  }
  move(x: number, y: number, pointer: number, threshold: number, config: RuntimeConfig = DEFAULT_CONFIG) {
    if (pointer !== this.pointer || this.down === null || !this.origin || this.preview) return false;
    const dx = x - this.origin.x, dy = y - this.origin.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < threshold) return false;
    const horizontal = Math.abs(dx) >= Math.abs(dy);
    const direction: SwipeDirection = horizontal ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down');
    const row = Math.floor(this.down / config.gridWidth), col = this.down % config.gridWidth;
    const nextRow = row + (direction === 'up' ? -1 : direction === 'down' ? 1 : 0);
    const nextCol = col + (direction === 'left' ? -1 : direction === 'right' ? 1 : 0);
    const to = nextRow < 0 || nextRow >= config.gridHeight || nextCol < 0 || nextCol >= config.gridWidth
      ? null : nextRow * config.gridWidth + nextCol;
    this.preview = { from: this.down, to, direction };
    return true;
  }
  end(cell: number | null, pointer: number, x?: number, y?: number, threshold = 0, config: RuntimeConfig = DEFAULT_CONFIG): [number, number] | null {
    if (pointer !== this.pointer) return null;
    if (x !== undefined && y !== undefined && threshold > 0) this.move(x, y, pointer, threshold, config);
    const down = this.down, preview = this.preview;
    this.down = this.pointer = null; this.origin = null; this.preview = null;
    if (preview) { this.selected = null; return preview.to === null ? null : [preview.from, preview.to]; }
    if (down === null || cell === null) { this.selected = null; return null; }
    if (down !== cell) { this.selected = null; return [down, cell]; }
    if (this.selected !== null && this.selected !== cell) { const from = this.selected; this.selected = null; return [from, cell]; }
    this.selected = this.selected === cell ? null : cell; return null;
  }
}
