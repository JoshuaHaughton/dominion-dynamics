import type { LngLatBoundsLike, Map } from "maplibre-gl";
import type { PathGeoJson } from "@dominion-dynamics/shared";

type LonLat = readonly [number, number];

/** Pan the map center to a lon/lat. */
export function easeMapToPoint(
  map: Map,
  lon: number,
  lat: number,
  durationMs: number,
): void {
  map.easeTo({
    center: [lon, lat],
    duration: durationMs,
  });
}

/** Fit the viewport to geographic bounds. */
export function fitMapToBounds(
  map: Map,
  bounds: LngLatBoundsLike,
  padding: number,
  durationMs: number,
): void {
  map.fitBounds(bounds, {
    padding,
    duration: durationMs,
  });
}

/** Build MapLibre bounds from lon/lat pairs. Returns null when empty. */
export function boundsFromCoordinates(
  coordinates: readonly LonLat[],
): LngLatBoundsLike | null {
  if (coordinates.length === 0) {
    return null;
  }

  let minLon = Infinity;
  let minLat = Infinity;
  let maxLon = -Infinity;
  let maxLat = -Infinity;

  for (const [lon, lat] of coordinates) {
    minLon = Math.min(minLon, lon);
    minLat = Math.min(minLat, lat);
    maxLon = Math.max(maxLon, lon);
    maxLat = Math.max(maxLat, lat);
  }

  return [
    [minLon, minLat],
    [maxLon, maxLat],
  ];
}

/** Fit bounds for a saved patrol path line. */
export function boundsFromPatrolPath(
  patrolPath: PathGeoJson,
): LngLatBoundsLike | null {
  const coordinates = patrolPath.geometry.coordinates.map(
    ([lon, lat]) => [lon, lat] as const,
  );

  return boundsFromCoordinates(coordinates);
}
