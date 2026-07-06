import type { Asset } from "@dominion-dynamics/shared";
import { isDrone } from "../../sim/store/store.js";
import { evaluateZoneThreat } from "./evaluateAsset.js";
import type { CachedZone } from "../types.js";

/** Attach zone threat state to traffic assets; patrol assets get zone null. */
export function enrichTrafficWithZoneThreat(
  assets: readonly Asset[],
  zones: readonly CachedZone[],
): Asset[] {
  return assets.map((asset) => {
    if (isDrone(asset)) {
      return { ...asset, zone: null };
    }

    return {
      ...asset,
      zone: evaluateZoneThreat(asset, zones),
    };
  });
}
