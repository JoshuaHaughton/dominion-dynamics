import type { Asset } from "@dominion-dynamics/shared";
import { evaluateAssetThreat } from "./evaluateAsset.js";
import { nearestZoneDistanceM } from "./nearestZoneDistance.js";
import type { CachedZone } from "./types.js";

/** Attach zone-derived live fields to every asset in a snapshot. */
export function enrichLiveAssets(
  assets: readonly Asset[],
  zones: readonly CachedZone[],
): Asset[] {
  return assets.map((asset) => {
    const threat = evaluateAssetThreat(asset, zones);

    return {
      ...asset,
      ...threat,
      nearestZoneDistanceM: nearestZoneDistanceM(asset, zones),
    };
  });
}
