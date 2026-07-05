import type { CreateZoneRequest, ZoneGeoJson } from "@dominion-dynamics/shared";

export type ZoneValidationResult =
  | { ok: true; value: CreateZoneRequest }
  | { ok: false; error: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isPosition(value: unknown): value is [number, number] {
  if (!Array.isArray(value) || value.length < 2) {
    return false;
  }

  const [lon, lat] = value;

  return (
    typeof lon === "number" &&
    Number.isFinite(lon) &&
    lon >= -180 &&
    lon <= 180 &&
    typeof lat === "number" &&
    Number.isFinite(lat) &&
    lat >= -90 &&
    lat <= 90
  );
}

function isClosedRing(ring: [number, number][]): boolean {
  if (ring.length < 4) {
    return false;
  }

  const first = ring[0];
  const last = ring[ring.length - 1];

  return first[0] === last[0] && first[1] === last[1];
}

/** Validate POST body for a restricted zone polygon feature. */
export function validateCreateZoneBody(body: unknown): ZoneValidationResult {
  if (!isRecord(body)) {
    return { ok: false, error: "Body must be an object" };
  }

  const name = body.name;

  if (typeof name !== "string" || name.trim().length === 0) {
    return { ok: false, error: "name must be a non-empty string" };
  }

  const geojson = body.geojson;

  if (!isValidZoneGeoJson(geojson)) {
    return { ok: false, error: "geojson must be a Polygon Feature with a closed ring" };
  }

  return {
    ok: true,
    value: { name: name.trim(), geojson },
  };
}

/** Type guard for a Polygon Feature suitable for a restricted zone. */
export function isValidZoneGeoJson(value: unknown): value is ZoneGeoJson {
  if (!isRecord(value)) {
    return false;
  }

  if (value.type !== "Feature") {
    return false;
  }

  const geometry = value.geometry;

  if (!isRecord(geometry) || geometry.type !== "Polygon") {
    return false;
  }

  const coordinates = geometry.coordinates;

  if (!Array.isArray(coordinates) || coordinates.length === 0) {
    return false;
  }

  const outerRing = coordinates[0];

  if (!Array.isArray(outerRing)) {
    return false;
  }

  const ring: [number, number][] = [];

  for (const position of outerRing) {
    if (!isPosition(position)) {
      return false;
    }

    ring.push(position);
  }

  return isClosedRing(ring);
}
