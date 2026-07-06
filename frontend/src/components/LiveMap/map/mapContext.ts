import type {
  Asset,
  AssetTrackDetail,
  PathGeoJson,
  ZoneGeoJson,
} from "@dominion-dynamics/shared";
import type { ZoneView } from "../zones/useZones.js";

/** Latest props/callbacks for map listeners without re-binding handlers each render. */
export type MapContext = {
  assets: readonly Asset[];
  zones: readonly ZoneView[];
  patrolPath: PathGeoJson | null;
  trackDetail: AssetTrackDetail | null;
  selectedAssetId: string | null;
  onAssetSelect: (assetId: string | null) => void;
  onFollowingChange: (isFollowing: boolean) => void;
  onZoneDrawn: (geojson: ZoneGeoJson) => void;
  onPatrolPathDrawn: (geojson: PathGeoJson) => void;
  onZoneDrawError: (message: string) => void;
  onPatrolDrawError: (message: string) => void;
};
