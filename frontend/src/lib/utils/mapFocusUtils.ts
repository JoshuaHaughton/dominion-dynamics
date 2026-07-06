import type { LngLatBoundsLike, Map } from "maplibre-gl";
import type { Asset, PathGeoJson, ZoneGeoJson } from "@dominion-dynamics/shared";
import { MAP_FIT_PADDING } from "../constants/mapConstants.js";

type LonLat = readonly [number, number];

const DEFAULT_FIT_MAX_ZOOM = 14;

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

/** Fit the viewport to geographic bounds (center + zoom chosen by MapLibre). */
export function fitMapToBounds(
  map: Map,
  bounds: LngLatBoundsLike,
  durationMs: number,
): void {
  map.fitBounds(bounds, {
    padding: MAP_FIT_PADDING,
    duration: durationMs,
    maxZoom: DEFAULT_FIT_MAX_ZOOM,
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

/** Fit bounds for live asset positions. */
export function boundsFromAssets(
  assets: readonly Pick<Asset, "lon" | "lat">[],
): LngLatBoundsLike | null {
  return boundsFromCoordinates(
    assets.map((asset) => [asset.lon, asset.lat] as const),
  );
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

/** Fit bounds for a restricted zone polygon. */
export function boundsFromZoneGeoJson(
  geojson: ZoneGeoJson,
): LngLatBoundsLike | null {
  const ring = geojson.geometry.coordinates[0];

  if (ring === undefined) {
    return null;
  }

  return boundsFromCoordinates(
    ring.map(([lon, lat]) => [lon, lat] as const),
  );
}
