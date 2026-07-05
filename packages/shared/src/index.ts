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
  TRACK_HISTORY_WINDOW_SECONDS,
  trackHistoryCapacity,
} from "./liveTrack.js";

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

export type { IcaoEmitterCategory } from "./icaoCategory.js";
export {
  ICAO_EMITTER_CATEGORY_LABELS,
  ICAO_EMITTER_CATEGORY_SHORT_LABELS,
  icaoCategoryLabel,
  icaoCategoryShortLabel,
  isIcaoEmitterCategory,
} from "./icaoCategory.js";
