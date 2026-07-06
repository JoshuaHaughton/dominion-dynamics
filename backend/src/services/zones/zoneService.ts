import type { CreateZoneRequest, Zone } from "@dominion-dynamics/shared";
import { db } from "../../db/index.js";
import {
  deleteZoneById,
  listZoneRows,
  insertZone,
} from "../../repositories/zoneRepository.js";
import {
  appendZoneToCache,
  removeZoneFromCache,
} from "../../modules/threat/zoneGeometryCache.js";

/** Read all restricted zones for API and threat cache bootstrap. */
export function listZones(): Zone[] {
  return listZoneRows(db);
}

/** Persist a new zone and append it to the in-memory geometry cache. */
export function createZone(input: CreateZoneRequest): Zone {
  const zone = insertZone(input, db);

  appendZoneToCache(zone);

  return zone;
}

/** Delete a zone from SQLite and drop it from the geometry cache. */
export function deleteZone(id: number): boolean {
  const deleted = deleteZoneById(id, db);

  if (!deleted) {
    return false;
  }

  removeZoneFromCache(id);

  return true;
}
