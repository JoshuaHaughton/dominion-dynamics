import { z } from "zod";
import { AssetTrackDetailSchema, SelectedTrackDeltaSchema } from "./assetTrack.js";

export const AssetSchema = z.object({
  id: z.string(),
  lat: z.number().finite(),
  lon: z.number().finite(),
  alt: z.number().finite(),
  heading: z.number().finite(),
  speed: z.number().finite(),
  source: z.enum(["opensky", "synthetic"]),
  category: z.number().int().min(0).max(20),
  callsign: z.string().nullable(),
  originCountry: z.string().nullable(),
  onGround: z.boolean(),
  threat: z.enum(["normal", "warning", "critical"]),
  tteSeconds: z.number().finite().nullable(),
  nearestZoneDistanceM: z.number().finite().min(0).nullable(),
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

export type Asset = z.infer<typeof AssetSchema>;
export type SnapshotMessage = z.infer<typeof SnapshotMessageSchema>;
export type LiveServerMessage = SnapshotMessage;
export const LiveServerMessageSchema = SnapshotMessageSchema;
