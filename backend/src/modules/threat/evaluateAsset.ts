import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import { point } from "@turf/helpers";
import type { Asset, AssetZoneState, ThreatLevel } from "@dominion-dynamics/shared";
import { isAssetNearZoneBbox } from "./bboxPrefilter.js";
import { WARNING_WINDOW_SECONDS, DEFAULT_TRAFFIC_ZONE } from "./constants.js";
import { rayTteSeconds } from "./rayTte.js";
import { distancePointToBoundaryM } from "./zoneBoundaryDistance.js";
import type { CachedZone } from "./types.js";

/** Whether the asset position is inside the zone polygon. */
function isInsideZone(
  asset: Pick<Asset, "lat" | "lon">,
  zone: CachedZone,
): boolean {
  return booleanPointInPolygon(point([asset.lon, asset.lat]), zone.polygon);
}

/**
 * Classify one traffic asset against all restricted zones in a single pass.
 * Critical when inside any zone; warning when ray TTE is within five minutes.
 */
export function evaluateZoneThreat(
  asset: Asset,
  zones: readonly CachedZone[],
): AssetZoneState {
  if (zones.length === 0) {
    return DEFAULT_TRAFFIC_ZONE;
  }

  const assetPoint = point([asset.lon, asset.lat]);
  let minTteSeconds: number | null = null;
  let nearestBoundaryM: number | null = null;

  for (const zone of zones) {
    if (booleanPointInPolygon(assetPoint, zone.polygon)) {
      return { threat: "critical", tteSeconds: 0, nearestBoundaryM: 0 };
    }

    const boundaryM = distancePointToBoundaryM(assetPoint, zone.boundary);

    if (nearestBoundaryM === null || boundaryM < nearestBoundaryM) {
      nearestBoundaryM = boundaryM;
    }

    if (!isAssetNearZoneBbox(asset, zone, WARNING_WINDOW_SECONDS)) {
      continue;
    }

    const tteSeconds = rayTteSeconds(asset, zone);

    if (tteSeconds === null) continue;

    if (minTteSeconds === null || tteSeconds < minTteSeconds) {
      minTteSeconds = tteSeconds;
    }
  }

  if (minTteSeconds !== null && minTteSeconds <= WARNING_WINDOW_SECONDS) {
    return {
      threat: "warning",
      tteSeconds: minTteSeconds,
      nearestBoundaryM,
    };
  }

  const threat: ThreatLevel = "normal";

  return { threat, tteSeconds: null, nearestBoundaryM };
}
