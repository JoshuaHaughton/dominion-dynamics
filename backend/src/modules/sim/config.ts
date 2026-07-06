import type { SimBounds } from "@dominion-dynamics/shared";
import { DEFAULT_SIM_SEED_REGION } from "@dominion-dynamics/shared";
import { z } from "zod";

/** Simulated asset count when ASSET_COUNT is unset. */
export const DEFAULT_ASSET_COUNT = 120;
/** Sim tick interval when TICK_MS is unset. */
export const DEFAULT_TICK_MS = 1000;

/** Minimum synthetic aircraft altitude at seed time (meters). */
export const SYNTHETIC_ALT_MIN_M = 500;
/** Maximum synthetic aircraft altitude at seed time (meters). */
export const SYNTHETIC_ALT_MAX_M = 12_000;

/** Spread entry headings so respawned tracks don't all aim at the region center. */
export const RESPAWN_HEADING_JITTER_DEG = 30;

const SimEnvSchema = z.object({
  ASSET_COUNT: z.coerce.number().int().positive().default(DEFAULT_ASSET_COUNT),
  TICK_MS: z.coerce.number().int().positive().default(DEFAULT_TICK_MS),
  SIM_SEED_MIN_LAT: z.coerce
    .number()
    .min(-90)
    .max(90)
    .default(DEFAULT_SIM_SEED_REGION.minLat),
  SIM_SEED_MAX_LAT: z.coerce
    .number()
    .min(-90)
    .max(90)
    .default(DEFAULT_SIM_SEED_REGION.maxLat),
  SIM_SEED_MIN_LON: z.coerce
    .number()
    .min(-180)
    .max(180)
    .default(DEFAULT_SIM_SEED_REGION.minLon),
  SIM_SEED_MAX_LON: z.coerce
    .number()
    .min(-180)
    .max(180)
    .default(DEFAULT_SIM_SEED_REGION.maxLon),
});

const simEnv = SimEnvSchema.parse(process.env);

/** Seed/respawn bounding box, overridable per-edge via SIM_SEED_* env vars. */
export const SIM_SEED_REGION: SimBounds = {
  minLat: simEnv.SIM_SEED_MIN_LAT,
  maxLat: simEnv.SIM_SEED_MAX_LAT,
  minLon: simEnv.SIM_SEED_MIN_LON,
  maxLon: simEnv.SIM_SEED_MAX_LON,
};

/** Resolved sim runtime configuration (env overrides applied). */
export const simConfig = {
  assetCount: simEnv.ASSET_COUNT,
  tickMs: simEnv.TICK_MS,
  seedRegion: SIM_SEED_REGION,
};
