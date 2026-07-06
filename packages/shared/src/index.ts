export type { AssetRole, SimBounds, ThreatLevel } from "./asset/types.js";
export {
  AssetRoleSchema,
  DEFAULT_SIM_SEED_REGION,
  ThreatLevelSchema,
} from "./asset/types.js";

export type {
  Asset,
  AssetDroneState,
  AssetZoneState,
  DroneDispatchState,
  DroneRouteState,
  LiveServerMessage,
  SnapshotMessage,
} from "./asset/schema.js";
export {
  AssetDroneStateSchema,
  AssetSchema,
  AssetZoneStateSchema,
  DroneDispatchStateSchema,
  DroneRouteStateSchema,
  LiveServerMessageSchema,
  SnapshotMessageSchema,
} from "./asset/schema.js";

export type {
  AssetHistoryPoint,
  AssetTrackDetail,
  PredictedPathLine,
  SelectedTrackDelta,
} from "./asset/track.js";
export {
  AssetHistoryPointSchema,
  AssetTrackDetailSchema,
  PredictedPathLineSchema,
  SelectedTrackDeltaSchema,
} from "./asset/track.js";

export {
  DEFAULT_SIM_TICK_MS,
  DEFAULT_TRACK_HISTORY_CAPACITY,
  THREAT_WARNING_WINDOW_SECONDS,
  trackHistoryCapacity,
} from "./track/history.js";

export type {
  ClientLiveMessage,
  DeselectAssetMessage,
  SelectAssetMessage,
} from "./realtime/clientMessages.js";
export {
  ClientLiveMessageSchema,
  DeselectAssetMessageSchema,
  SelectAssetMessageSchema,
} from "./realtime/clientMessages.js";

export type { CreateZoneRequest, Zone, ZoneGeoJson } from "./zone/schema.js";
export {
  CreateZoneRequestSchema,
  ZoneGeoJsonSchema,
  ZoneIdParamSchema,
  ZoneListSchema,
  ZoneSchema,
} from "./zone/schema.js";

export type {
  PathGeoJson,
  PathKind,
  PathRecord,
  PatrolPath,
  PatrolPathResponse,
  SavePatrolPathRequest,
} from "./patrol/path.js";
export {
  PathGeoJsonSchema,
  PathKindSchema,
  PathRecordSchema,
  PatrolPathResponseSchema,
  PatrolPathSchema,
  SavePatrolPathRequestSchema,
} from "./patrol/path.js";

export type { ValidationErrorBody } from "./api/validationError.js";
export { ValidationErrorBodySchema } from "./api/validationError.js";

export type { PatrolMode } from "./patrol/constants.js";
export {
  DRONE_ICAO_CATEGORY,
  PATROL_ASSET_ID,
  PATROL_CALLSIGN,
  PatrolModeSchema,
} from "./patrol/constants.js";

export type { Airport } from "./airport/schema.js";
export { AirportSchema } from "./airport/schema.js";

export type { DispatchPhase, DroneOrigin } from "./dispatch/constants.js";
export {
  DispatchPhaseSchema,
  DroneOriginSchema,
} from "./dispatch/constants.js";

export type { IcaoEmitterCategory } from "./icao/emitterCategory.js";
export {
  ICAO_EMITTER_CATEGORY_LABELS,
  ICAO_EMITTER_CATEGORY_SHORT_LABELS,
  icaoCategoryLabel,
  icaoCategoryShortLabel,
  isIcaoEmitterCategory,
} from "./icao/emitterCategory.js";
