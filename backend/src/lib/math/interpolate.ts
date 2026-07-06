/** Clamp a value into [min, max]. */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** Linear interpolation from a to b by t (t is not clamped). */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
