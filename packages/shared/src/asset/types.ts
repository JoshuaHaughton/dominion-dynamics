import { z } from "zod";

/** Operational role of a live map asset. */
export const AssetRoleSchema = z.enum(["traffic", "drone"]);
export type AssetRole = z.infer<typeof AssetRoleSchema>;

export const ThreatLevelSchema = z.enum(["normal", "warning", "critical"]);
export type ThreatLevel = z.infer<typeof ThreatLevelSchema>;

/** Geographic rectangle for sim seed regions. */
export type SimBounds = {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
};

/** Ottawa-Gatineau demo AOI — default sim seed region (backend env vars can override per edge). */
export const DEFAULT_SIM_SEED_REGION: SimBounds = {
  minLat: 45.2,
  maxLat: 45.6,
  minLon: -76.1,
  maxLon: -75.3,
};
