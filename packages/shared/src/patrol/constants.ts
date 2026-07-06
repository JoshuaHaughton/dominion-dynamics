import { z } from "zod";

/** Fixed singleton id for the user patrol drone slot. */
export const PATROL_ASSET_ID = "a0000000-0000-4000-8000-000000000001";

/** Operator-facing callsign for the patrol drone. */
export const PATROL_CALLSIGN = "Patrol-1";

/** ICAO emitter category 14 (UAV) — used for every simulated drone asset. */
export const DRONE_ICAO_CATEGORY = 14;

export const PatrolModeSchema = z.enum(["patrol", "shadow", "rejoin"]);
export type PatrolMode = z.infer<typeof PatrolModeSchema>;
