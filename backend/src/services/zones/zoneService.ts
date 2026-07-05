import type { CreateZoneRequest, Zone } from "@dominion-dynamics/shared";
import { db } from "../../db/index.js";
import type { AppDatabase } from "../../db/types.js";
import { findAllZones, insertZone } from "../../repositories/zoneRepository.js";
import { appendZoneToCache } from "../../modules/threat/zoneGeometryCache.js";

/** Read all restricted zones for API and threat cache bootstrap. */
export function listZones(database: AppDatabase = db): Zone[] {
  return findAllZones(database);
}

/** Persist a new zone and append it to the in-memory geometry cache. */
export function createZone(
  input: CreateZoneRequest,
  database: AppDatabase = db,
): Zone {
  const zone = insertZone(input, database);

  appendZoneToCache(zone);

  return zone;
}
