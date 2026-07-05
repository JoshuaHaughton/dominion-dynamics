import type { Asset } from "@dominion-dynamics/shared";
import { evaluateAssetThreat } from "./evaluateAsset.js";
import { getNearestZoneDistanceM } from "./nearestZoneDistance.js";
import type { CachedZone } from "./types.js";

/** Attach zone threat, zone TTE, and nearest-zone distance to traffic assets. */
export function enrichTrafficWithZoneThreat(
  assets: readonly Asset[],
  zones: readonly CachedZone[],
): Asset[] {
  return assets.map((asset) => {
    const threat = evaluateAssetThreat(asset, zones);

    return {
      ...asset,
      ...threat,
      nearestZoneDistanceM: getNearestZoneDistanceM(asset, zones),
    };
  });
}
