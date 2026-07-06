import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import { point } from "@turf/helpers";
import type {
  Asset,
  AssetZoneState,
  ThreatLevel,
} from "@dominion-dynamics/shared";
import { isAssetNearZoneBbox } from "./bboxPrefilter.js";
import { THREAT_WARNING_WINDOW_SECONDS } from "@dominion-dynamics/shared";
import { DEFAULT_TRAFFIC_ZONE } from "../constants.js";
import { rayTteSeconds } from "./rayTte.js";
import { distancePointToBoundaryM } from "./zoneBoundaryDistance.js";
import type { CachedZone } from "../types.js";

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
      return { threat: "critical", zoneTteSeconds: 0, nearestBoundaryM: 0 };
    }

    const boundaryM = distancePointToBoundaryM(assetPoint, zone.boundary);

    if (nearestBoundaryM === null || boundaryM < nearestBoundaryM) {
      nearestBoundaryM = boundaryM;
    }

    if (!isAssetNearZoneBbox(asset, zone, THREAT_WARNING_WINDOW_SECONDS)) {
      continue;
    }

    const tteSeconds = rayTteSeconds(asset, zone);

    if (tteSeconds === null) continue;

    if (minTteSeconds === null || tteSeconds < minTteSeconds) {
      minTteSeconds = tteSeconds;
    }
  }

  if (
    minTteSeconds !== null &&
    minTteSeconds <= THREAT_WARNING_WINDOW_SECONDS
  ) {
    return {
      threat: "warning",
      zoneTteSeconds: minTteSeconds,
      nearestBoundaryM,
    };
  }

  const threat: ThreatLevel = "normal";

  return { threat, zoneTteSeconds: null, nearestBoundaryM };
}
