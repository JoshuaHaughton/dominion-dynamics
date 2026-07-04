import type { SimBounds } from "@dominion-dynamics/shared";

export type IngestMode = "seed" | "poll";

// Sim defaults (overridable via env vars).
export const DEFAULT_ASSET_COUNT = 120;
export const DEFAULT_TICK_MS = 1000;
export const DEFAULT_POLL_INTERVAL_MS = 30_000;

// Random ranges for synthetic aircraft at seed time.
export const SYNTHETIC_ALT_MIN_M = 500;
export const SYNTHETIC_ALT_MAX_M = 12_000;
export const SYNTHETIC_SPEED_MIN_MPS = 80;
export const SYNTHETIC_SPEED_MAX_MPS = 250;

// Spread entry headings so respawned tracks don't all aim at the region center.
export const RESPAWN_HEADING_JITTER_DEG = 30;

// Ottawa-Gatineau operating area (demo AOI).
// Box around the capital region for synthetic spawn and OpenSky seed.
// Map stays global; frontend should fitBounds here on first load.
export const DEFAULT_SIM_SEED_MIN_LAT = 45.2;
export const DEFAULT_SIM_SEED_MAX_LAT = 45.6;
export const DEFAULT_SIM_SEED_MIN_LON = -76.1;
export const DEFAULT_SIM_SEED_MAX_LON = -75.3;

export const SIM_SEED_REGION: SimBounds = {
  minLat: Number(process.env.SIM_SEED_MIN_LAT ?? DEFAULT_SIM_SEED_MIN_LAT),
  maxLat: Number(process.env.SIM_SEED_MAX_LAT ?? DEFAULT_SIM_SEED_MAX_LAT),
  minLon: Number(process.env.SIM_SEED_MIN_LON ?? DEFAULT_SIM_SEED_MIN_LON),
  maxLon: Number(process.env.SIM_SEED_MAX_LON ?? DEFAULT_SIM_SEED_MAX_LON),
};

export const simConfig = {
  assetCount: Number(process.env.ASSET_COUNT ?? DEFAULT_ASSET_COUNT),
  tickMs: Number(process.env.TICK_MS ?? DEFAULT_TICK_MS),
  ingestMode: (process.env.INGEST_MODE ?? "seed") as IngestMode,
  pollIntervalMs: Number(process.env.OPENSKY_POLL_MS ?? DEFAULT_POLL_INTERVAL_MS),
  seedRegion: SIM_SEED_REGION,
};
