import { z } from "zod";
import { AssetTrackDetailSchema, SelectedTrackDeltaSchema } from "./track.js";

export const AssetZoneStateSchema = z.object({
  threat: z.enum(["normal", "warning", "critical"]),
  tteSeconds: z.number().finite().nullable(),
  nearestBoundaryM: z.number().finite().min(0).nullable(),
});

export const AssetPatrolStateSchema = z.object({
  mode: z.enum(["patrol", "shadow", "rejoin"]),
  shadowTargetId: z.string().nullable(),
  /** Set when the route is persisted; omitted until the user saves a patrol path. */
  pathId: z.number().int().positive().optional(),
});

export const AssetSchema = z.object({
  id: z.string(),
  lat: z.number().finite(),
  lon: z.number().finite(),
  alt: z.number().finite(),
  heading: z.number().finite(),
  speed: z.number().finite(),
  role: z.enum(["traffic", "patrol"]),
  category: z.number().int().min(0).max(20),
  callsign: z.string().nullable(),
  originCountry: z.string().nullable(),
  onGround: z.boolean(),
  /** Zone threat state for traffic; null when {@link AssetSchema.shape.role} is `"patrol"`. */
  zone: AssetZoneStateSchema.nullable(),
  /** Present when {@link AssetSchema.shape.role} is `"patrol"`. */
  patrol: AssetPatrolStateSchema.optional(),
});

/** WebSocket live snapshot message. */
export const SnapshotMessageSchema = z.object({
  type: z.literal("snapshot"),
  ts: z.number().finite(),
  assets: z.array(AssetSchema),
  /** Per-connection full track overlay (select / reconnect). */
  selectedTrack: AssetTrackDetailSchema.optional(),
  /** Per-connection incremental track update after selectedTrack. */
  selectedTrackDelta: SelectedTrackDeltaSchema.optional(),
});

export type AssetZoneState = z.infer<typeof AssetZoneStateSchema>;
export type AssetPatrolState = z.infer<typeof AssetPatrolStateSchema>;
export type Asset = z.infer<typeof AssetSchema>;
export type SnapshotMessage = z.infer<typeof SnapshotMessageSchema>;
export type LiveServerMessage = SnapshotMessage;
export const LiveServerMessageSchema = SnapshotMessageSchema;
