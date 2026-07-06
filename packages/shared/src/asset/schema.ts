import { z } from "zod";
import { AssetTrackDetailSchema, SelectedTrackDeltaSchema } from "./track.js";

export const AssetZoneStateSchema = z.object({
  threat: z.enum(["normal", "warning", "critical"]),
  zoneTteSeconds: z.number().finite().nullable(),
  nearestBoundaryM: z.number().finite().min(0).nullable(),
});

/** Route-following state for drones with {@link AssetDroneStateSchema.shape.origin} `"patrol"`. */
export const DroneRouteStateSchema = z.object({
  mode: z.enum(["patrol", "shadow", "rejoin"]),
  shadowTargetId: z.string().nullable(),
  /** Set when the route is persisted; omitted until the user saves a patrol path. */
  pathId: z.number().int().positive().optional(),
});

/** Airport scramble mission state while auto-dispatching on critical traffic. */
export const DroneDispatchStateSchema = z.object({
  targetId: z.string(),
  phase: z.enum(["enroute", "intercepting", "trailing", "rtb", "at_base"]),
  homeAirportIdent: z.string(),
  /** Resolved from the airport registry for operator-facing labels. */
  homeAirportName: z.string().optional(),
  /** Seconds until intercept while en-route or closing; null once trailing or RTB. */
  interceptEtaSeconds: z.number().finite().nullable().optional(),
});

export const AssetDroneStateSchema = z.object({
  origin: z.enum(["patrol", "dispatch"]),
  patrol: DroneRouteStateSchema.optional(),
  dispatch: DroneDispatchStateSchema.optional(),
});

export const AssetSchema = z.object({
  id: z.string(),
  lat: z.number().finite(),
  lon: z.number().finite(),
  alt: z.number().finite(),
  heading: z.number().finite(),
  speed: z.number().finite(),
  role: z.enum(["traffic", "drone"]),
  category: z.number().int().min(0).max(20),
  callsign: z.string().nullable(),
  originCountry: z.string().nullable(),
  onGround: z.boolean(),
  /** Zone threat state for traffic; null when {@link AssetSchema.shape.role} is `"drone"`. */
  zone: AssetZoneStateSchema.nullable(),
  /** Present when {@link AssetSchema.shape.role} is `"drone"`. */
  drone: AssetDroneStateSchema.optional(),
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
export type DroneRouteState = z.infer<typeof DroneRouteStateSchema>;
export type DroneDispatchState = z.infer<typeof DroneDispatchStateSchema>;
export type AssetDroneState = z.infer<typeof AssetDroneStateSchema>;
export type Asset = z.infer<typeof AssetSchema>;
export type SnapshotMessage = z.infer<typeof SnapshotMessageSchema>;
export type LiveServerMessage = SnapshotMessage;
export const LiveServerMessageSchema = SnapshotMessageSchema;
