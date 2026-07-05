import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import { point } from "@turf/helpers";
import type { Asset, ThreatLevel } from "@dominion-dynamics/shared";
import { isAssetNearZoneBbox } from "./bboxPrefilter.js";
import { WARNING_WINDOW_SECONDS } from "./constants.js";
import { rayTteSeconds } from "./rayTte.js";
import type { CachedZone } from "./types.js";

type ThreatEvaluation = Pick<Asset, "threat" | "tteSeconds">;

/** Whether the asset position is inside the zone polygon. */
function isInsideZone(
  asset: Pick<Asset, "lat" | "lon">,
  zone: CachedZone,
): boolean {
  return booleanPointInPolygon(point([asset.lon, asset.lat]), zone.polygon);
}

/**
 * Classify one asset against all restricted zones.
 * Critical when inside any zone; warning when ray TTE is within five minutes.
 */
export function evaluateAssetThreat(
  asset: Asset,
  zones: readonly CachedZone[],
): ThreatEvaluation {
  if (zones.length === 0) {
    return { threat: "normal", tteSeconds: null };
  }

  // Breach check first: inside any zone is critical regardless of heading.
  for (const zone of zones) {
    if (!isAssetNearZoneBbox(asset, zone, WARNING_WINDOW_SECONDS)) {
      continue;
    }

    if (isInsideZone(asset, zone)) {
      return { threat: "critical", tteSeconds: 0 };
    }
  }

  // Ray TTE per nearby zone; shortest entry time wins for warning.
  let minTteSeconds: number | null = null;

  for (const zone of zones) {
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
    return { threat: "warning", tteSeconds: minTteSeconds };
  }

  const threat: ThreatLevel = "normal";

  return { threat, tteSeconds: null };
}

/** Attach server-computed threat fields to every asset in a live snapshot. */
export function enrichAssetsWithThreat(
  assets: readonly Asset[],
  zones: readonly CachedZone[],
): Asset[] {
  return assets.map((asset) => {
    const threat = evaluateAssetThreat(asset, zones);

    return { ...asset, ...threat };
  });
}
