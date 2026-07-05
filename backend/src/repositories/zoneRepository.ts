import type { CreateZoneRequest, Zone } from "@dominion-dynamics/shared";
import { db } from "../db/index.js";
import type { AppDatabase } from "../db/types.js";
import { zones } from "../db/schema.js";

/** Read all restricted zone rows from SQLite. */
export function findAllZones(database: AppDatabase = db): Zone[] {
  const rows = database.select().from(zones).all();

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    geojson: JSON.parse(row.geojson) as Zone["geojson"],
  }));
}

/** Insert a restricted zone row and return the persisted record. */
export function insertZone(
  input: CreateZoneRequest,
  database: AppDatabase = db,
): Zone {
  const inserted = database
    .insert(zones)
    .values({
      name: input.name,
      geojson: JSON.stringify(input.geojson),
    })
    .returning()
    .get();

  return {
    id: inserted.id,
    name: inserted.name,
    geojson: JSON.parse(inserted.geojson) as Zone["geojson"],
  };
}
