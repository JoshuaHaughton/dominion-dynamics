import type { Asset } from "@dominion-dynamics/shared";
import type { CachedZone } from "./types.js";

const METERS_PER_DEGREE_LAT = 111_320;

/** Convert meters to approximate longitude degrees at a given latitude. */
function metersToLonDegrees(meters: number, latitude: number): number {
  const cosLat = Math.cos((latitude * Math.PI) / 180);

  if (cosLat === 0) {
    return 0;
  }

  return meters / (METERS_PER_DEGREE_LAT * cosLat);
}

/** Convert meters to approximate latitude degrees. */
function metersToLatDegrees(meters: number): number {
  return meters / METERS_PER_DEGREE_LAT;
}

/**
 * Cheap rectangle check before polygon math.
 * Inflates the zone bbox by how far this asset could travel in the warning window.
 */
export function isAssetNearZoneBbox(
  asset: Pick<Asset, "lat" | "lon" | "speed">,
  zone: CachedZone,
  reachSeconds: number,
): boolean {
  const reachMeters = asset.speed * reachSeconds;
  const latPad = metersToLatDegrees(reachMeters);
  const lonPad = metersToLonDegrees(reachMeters, asset.lat);

  const [minLon, minLat, maxLon, maxLat] = zone.bbox;
  const expandedMinLon = minLon - lonPad;
  const expandedMinLat = minLat - latPad;
  const expandedMaxLon = maxLon + lonPad;
  const expandedMaxLat = maxLat + latPad;

  return (
    asset.lon >= expandedMinLon &&
    asset.lon <= expandedMaxLon &&
    asset.lat >= expandedMinLat &&
    asset.lat <= expandedMaxLat
  );
}
