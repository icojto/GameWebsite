/** One rounded normalized value for both text and bar. Rules retain raw heat. */
export function heatPercent(heat: number, maximum: number): number {
  const capacity = Number.isFinite(maximum) && maximum > 0 ? maximum : 100;
  return Math.round(Math.max(0, Math.min(100, (Number.isFinite(heat) ? heat : 0) / capacity * 100)));
}
