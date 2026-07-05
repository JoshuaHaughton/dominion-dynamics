export type { AssetRole, SimBounds, ThreatLevel } from "./asset/types.js";

export type {
  Asset,
  AssetPatrolState,
  AssetZoneState,
  LiveServerMessage,
  SnapshotMessage,
} from "./asset/schema.js";
export {
  AssetPatrolStateSchema,
  AssetSchema,
  AssetZoneStateSchema,
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
  AssetIdParamSchema,
  AssetTrackDetailSchema,
  PredictedPathLineSchema,
  SelectedTrackDeltaSchema,
} from "./asset/track.js";

export {
  DEFAULT_SIM_TICK_MS,
  DEFAULT_TRACK_HISTORY_CAPACITY,
  TRACK_HISTORY_WINDOW_SECONDS,
  trackHistoryCapacity,
} from "./track/history.js";

export type {
  ClientLiveMessage,
  DeselectAssetMessage,
  SelectAssetMessage,
} from "./live/client.js";
export {
  ClientLiveMessageSchema,
  DeselectAssetMessageSchema,
  SelectAssetMessageSchema,
} from "./live/client.js";

export type { CreateZoneRequest, Zone, ZoneGeoJson } from "./zone/schema.js";
export {
  CreateZoneRequestSchema,
  ZoneGeoJsonSchema,
  ZoneListSchema,
  ZoneSchema,
} from "./zone/schema.js";

export type {
  PathGeoJson,
  PathKind,
  PathRecord,
  PatrolPath,
  SavePatrolPathRequest,
} from "./patrol/path.js";
export {
  PathGeoJsonSchema,
  PathKindSchema,
  PathRecordSchema,
  PatrolPathSchema,
  SavePatrolPathRequestSchema,
} from "./patrol/path.js";

export type { PatrolMode } from "./patrol/constants.js";
export { PATROL_ASSET_ID } from "./patrol/constants.js";

export type { IcaoEmitterCategory } from "./icao/emitterCategory.js";
export {
  ICAO_EMITTER_CATEGORY_LABELS,
  ICAO_EMITTER_CATEGORY_SHORT_LABELS,
  icaoCategoryLabel,
  icaoCategoryShortLabel,
  isIcaoEmitterCategory,
} from "./icao/emitterCategory.js";
