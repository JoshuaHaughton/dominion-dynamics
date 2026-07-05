import type { CreateZoneRequest, Zone } from "@dominion-dynamics/shared";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { db } from "../../db/index.js";
import * as schema from "../../db/schema.js";
import { findAllZones, insertZone } from "../../repositories/zoneRepository.js";
import { appendZoneToCache } from "../../modules/threat/zoneGeometryCache.js";

type Database = BetterSQLite3Database<typeof schema>;

/** Read all restricted zones for API and threat cache bootstrap. */
export function listZones(database: Database = db): Zone[] {
  return findAllZones(database);
}

/** Persist a new zone and append it to the in-memory geometry cache. */
export function createZone(
  input: CreateZoneRequest,
  database: Database = db,
): Zone {
  const zone = insertZone(input, database);

  appendZoneToCache(zone);

  return zone;
}
