import type { Zone, ZoneGeoJson } from "@dominion-dynamics/shared";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isZoneGeoJson(value: unknown): value is ZoneGeoJson {
  if (!isRecord(value) || value.type !== "Feature") {
    return false;
  }

  const geometry = value.geometry;

  return isRecord(geometry) && geometry.type === "Polygon";
}

/** Reject ids our SQLite-backed API would never return. */
function parseZoneId(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
    return null;
  }

  return value;
}

/** Validate and narrow a zones API payload to a Zone. */
export function parseZone(data: unknown): Zone | null {
  if (!isRecord(data)) {
    return null;
  }

  const id = parseZoneId(data.id);
  const name = data.name;
  const geojson = data.geojson;

  if (id === null) {
    return null;
  }

  if (typeof name !== "string") {
    return null;
  }

  if (!isZoneGeoJson(geojson)) {
    return null;
  }

  return { id, name, geojson };
}

/** Validate and narrow a GET /api/zones payload. */
export function parseZones(data: unknown): Zone[] | null {
  if (!Array.isArray(data)) {
    return null;
  }

  const zones: Zone[] = [];

  for (const item of data) {
    const zone = parseZone(item);

    if (!zone) {
      return null;
    }

    zones.push(zone);
  }

  return zones;
}
