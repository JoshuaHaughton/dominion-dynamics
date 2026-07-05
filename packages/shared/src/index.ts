export {
  type AssetSource,
  type SimBounds,
  type ThreatLevel,
} from "./asset.js";

export type { Asset } from "./schemas/wire.js";
export {
  AssetSchema,
  LiveServerMessageSchema,
  SnapshotMessageSchema,
  type LiveServerMessage,
  type SnapshotMessage,
} from "./schemas/wire.js";

export type {
  AssetHistoryPoint,
  AssetTrackDetail,
  PredictedPathLine,
  SelectedTrackDelta,
} from "./schemas/assetTrack.js";
export {
  AssetHistoryPointSchema,
  AssetIdParamSchema,
  AssetTrackDetailSchema,
  PredictedPathLineSchema,
  SelectedTrackDeltaSchema,
} from "./schemas/assetTrack.js";

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
} from "./schemas/liveClient.js";
export {
  ClientLiveMessageSchema,
  DeselectAssetMessageSchema,
  SelectAssetMessageSchema,
} from "./schemas/liveClient.js";

export type { CreateZoneRequest, Zone, ZoneGeoJson } from "./schemas/zone.js";
export {
  CreateZoneRequestSchema,
  ZoneGeoJsonSchema,
  ZoneListSchema,
  ZoneSchema,
} from "./schemas/zone.js";

export type { IcaoEmitterCategory } from "./icao/emitterCategory.js";
export {
  ICAO_EMITTER_CATEGORY_LABELS,
  ICAO_EMITTER_CATEGORY_SHORT_LABELS,
  icaoCategoryLabel,
  icaoCategoryShortLabel,
  isIcaoEmitterCategory,
} from "./icao/emitterCategory.js";
