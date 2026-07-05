import destination from "@turf/destination";
import distance from "@turf/distance";
import lineIntersect from "@turf/line-intersect";
import { lineString, point } from "@turf/helpers";
import type { Asset } from "@dominion-dynamics/shared";
import { WARNING_WINDOW_SECONDS } from "./constants.js";
import type { CachedZone } from "./types.js";

/** Ignore hits at the ray origin; we want the next fence crossing ahead, not grazing the start. */
const MIN_RAY_DISTANCE_KM = 0.000_001;

/**
 * Seconds until this asset would cross the zone boundary if it keeps its current
 * heading and speed. Returns null when the forward path misses the zone in time.
 */
export function rayTteSeconds(
  asset: Pick<Asset, "lat" | "lon" | "heading" | "speed">,
  zone: CachedZone,
): number | null {
  if (asset.speed <= 0) {
    return null;
  }

  const start = point([asset.lon, asset.lat]);
  const maxKm = (asset.speed * WARNING_WINDOW_SECONDS) / 1000;
  const end = destination(start, maxKm, asset.heading, { units: "kilometers" });
  const [endLon, endLat] = end.geometry.coordinates;

  // Forward path at current heading, capped at the five-minute warning window.
  const ray = lineString([
    [asset.lon, asset.lat],
    [endLon, endLat],
  ]);

  const hits = lineIntersect(ray, zone.polygon);
  let nearestKm: number | null = null;

  // Nearest crossing along the ray becomes time-to-entry at current speed.
  for (const hit of hits.features) {
    if (hit.geometry.type !== "Point") {
      continue;
    }

    const hitPoint = point(hit.geometry.coordinates);
    const hitKm = distance(start, hitPoint, { units: "kilometers" });

    if (hitKm <= MIN_RAY_DISTANCE_KM) {
      continue;
    }

    if (nearestKm === null || hitKm < nearestKm) {
      nearestKm = hitKm;
    }
  }

  if (nearestKm === null) {
    return null;
  }

  return (nearestKm * 1000) / asset.speed;
}
