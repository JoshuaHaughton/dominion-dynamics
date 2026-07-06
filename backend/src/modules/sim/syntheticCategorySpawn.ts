import type { IcaoEmitterCategory } from "@dominion-dynamics/shared";
import { randomInRange } from "../../lib/math/random.js";

type SpeedRange = { minMps: number; maxMps: number };

/** Airborne ICAO categories the synthetic sim may spawn. */
export const SYNTHETIC_SPAWNABLE_CATEGORIES = [
  2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14,
] as const satisfies readonly IcaoEmitterCategory[];

export type SyntheticSpawnableCategory =
  (typeof SYNTHETIC_SPAWNABLE_CATEGORIES)[number];

/** Spawn probability per category; weights sum to 1 (roughly real-world traffic mix). */
export const SYNTHETIC_CATEGORY_WEIGHTS: Record<
  SyntheticSpawnableCategory,
  number
> = {
  2: 0.16,
  3: 0.12,
  4: 0.2,
  5: 0.06,
  6: 0.1,
  7: 0.04,
  8: 0.06,
  9: 0.06,
  10: 0.04,
  11: 0.03,
  12: 0.04,
  14: 0.09,
};

/** Plausible cruise speed range (m/s) per ICAO emitter category. */
export const SPEED_RANGE_BY_CATEGORY: Record<
  SyntheticSpawnableCategory,
  SpeedRange
> = {
  2: { minMps: 40, maxMps: 80 },
  3: { minMps: 60, maxMps: 120 },
  4: { minMps: 150, maxMps: 250 },
  5: { minMps: 150, maxMps: 240 },
  6: { minMps: 200, maxMps: 280 },
  7: { minMps: 100, maxMps: 220 },
  8: { minMps: 0, maxMps: 60 },
  9: { minMps: 15, maxMps: 40 },
  10: { minMps: 0, maxMps: 30 },
  11: { minMps: 10, maxMps: 25 },
  12: { minMps: 10, maxMps: 35 },
  14: { minMps: 5, maxMps: 25 },
};

/** Pick a synthetic ICAO emitter category from the configured weight table. */
export function pickSyntheticCategory(): SyntheticSpawnableCategory {
  const draw = Math.random();
  let cumulative = 0;

  for (const category of SYNTHETIC_SPAWNABLE_CATEGORIES) {
    cumulative += SYNTHETIC_CATEGORY_WEIGHTS[category];

    if (draw < cumulative) {
      return category;
    }
  }

  return 4;
}

/** Sample a speed in m/s for an ICAO emitter category. */
export function sampleSpeedForCategory(
  category: SyntheticSpawnableCategory,
): number {
  const { minMps, maxMps } = SPEED_RANGE_BY_CATEGORY[category];

  return randomInRange(minMps, maxMps);
}

/** Pick category and matching speed for a new synthetic track. */
export function sampleSyntheticMotion(): {
  category: SyntheticSpawnableCategory;
  speed: number;
} {
  const category = pickSyntheticCategory();

  return {
    category,
    speed: sampleSpeedForCategory(category),
  };
}
