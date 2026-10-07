export type LayoutMode = 'wide' | 'portrait' | 'compact-landscape' | 'constrained';
export function layoutMode(width: number, height: number): LayoutMode {
  // A short, wide website allocation gains board height from side controls.
  if (width >= 360 && width > height && height < 520) return 'compact-landscape';
  if (width < 280 || height < 280) return 'constrained';
  if (width >= 760 && width / height > 1.08) return 'wide';
  return 'portrait';
}
export function orientation(width: number, height: number) { return width >= height ? 'landscape' : 'portrait'; }
