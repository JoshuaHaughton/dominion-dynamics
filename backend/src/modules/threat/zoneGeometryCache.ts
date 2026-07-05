import bbox from "@turf/bbox";
import type { Zone } from "@dominion-dynamics/shared";
import { listZones } from "../../services/zones/zoneService.js";
import type { CachedZone } from "./types.js";

let cachedZones: CachedZone[] = [];

/** Build a cached entry from a persisted zone row. */
export function toCachedZone(zone: Zone): CachedZone {
  const bounds = bbox(zone.geojson);

  return {
    id: zone.id,
    name: zone.name,
    polygon: zone.geojson,
    bbox: [bounds[0], bounds[1], bounds[2], bounds[3]],
  };
}

/** Load all zones from SQLite into the in-memory geometry cache (server startup). */
export function loadZoneGeometryCache(): void {
  try {
    cachedZones = listZones().map(toCachedZone);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);

    console.warn(`Failed to load zone geometry cache (${detail}); using no zones.`);
    cachedZones = [];
  }
}

/** Append one zone after POST /api/zones succeeds. */
export function appendZoneToCache(zone: Zone): void {
  cachedZones.push(toCachedZone(zone));
}

/** Read-only view of parsed zone geometry for threat evaluation. */
export function getCachedZones(): readonly CachedZone[] {
  return cachedZones;
}

/** Reset cache (tests). */
export function clearZoneGeometryCache(): void {
  cachedZones = [];
}
