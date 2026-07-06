import bbox from "@turf/bbox";
import polygonToLine from "@turf/polygon-to-line";
import type { Zone } from "@dominion-dynamics/shared";
import type { Feature, GeoJsonProperties, LineString } from "geojson";
import type { CachedZone } from "./types.js";

function isLineStringFeature(
  value: unknown,
): value is Feature<LineString, GeoJsonProperties> {
  if (
    typeof value !== "object" ||
    value === null ||
    !("type" in value) ||
    value.type !== "Feature" ||
    !("geometry" in value)
  ) {
    return false;
  }

  const { geometry } = value as Feature;

  return geometry?.type === "LineString";
}

/** Precompute the outer ring outline for boundary distance queries. */
function toZoneBoundary(polygon: CachedZone["polygon"]): Feature<LineString> {
  const boundary = polygonToLine(polygon);

  if (!isLineStringFeature(boundary)) {
    throw new Error(
      "Expected polygonToLine to return a LineString boundary Feature",
    );
  }

  return boundary;
}

/** Build a cached entry from a persisted zone row. */
export function toCachedZone(zone: Zone): CachedZone {
  const bounds = bbox(zone.geojson);

  return {
    id: zone.id,
    name: zone.name,
    polygon: zone.geojson,
    boundary: toZoneBoundary(zone.geojson),
    bbox: [bounds[0], bounds[1], bounds[2], bounds[3]],
  };
}

/**
 * Replace the cache with the given persisted zones (bootstrap hydration).
 * The cache is a passive read-model: it never loads data itself — the zone
 * service is its only writer after startup.
 */
export function primeZoneGeometryCache(zones: readonly Zone[]): void {
  cachedZones = zones.map(toCachedZone);
}

/** Append one zone after POST /api/zones succeeds. */
export function appendZoneToCache(zone: Zone): void {
  cachedZones.push(toCachedZone(zone));
}

/** Drop one zone after DELETE /api/zones/:id succeeds. */
export function removeZoneFromCache(zoneId: number): void {
  cachedZones = cachedZones.filter((zone) => zone.id !== zoneId);
}

/** Read-only view of parsed zone geometry for threat evaluation. */
export function getCachedZones(): readonly CachedZone[] {
  return cachedZones;
}

/** Reset cache (tests). */
export function clearZoneGeometryCache(): void {
  cachedZones = [];
}

let cachedZones: CachedZone[] = [];
