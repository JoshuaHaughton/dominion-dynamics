import type { Position } from "geojson";

export type LonLat = { lon: number; lat: number };

/**
 * Narrow a GeoJSON position (number[]) to a lon/lat pair.
 * Returns null for a missing or malformed position so callers can guard once
 * instead of sprinkling non-null assertions under noUncheckedIndexedAccess.
 */
export function lonLatFromPosition(
  position: Position | undefined,
): LonLat | null {
  if (!position) return null;

  const [lon, lat] = position;

  if (lon === undefined || lat === undefined) return null;

  return { lon, lat };
}
