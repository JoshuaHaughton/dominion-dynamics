/** Uniform random number in [min, max). */
export function randomInRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}
