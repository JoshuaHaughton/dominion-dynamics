import type { CreateZoneRequest, Zone } from "@dominion-dynamics/shared";
import { ZoneGeoJsonSchema } from "@dominion-dynamics/shared";
import { eq } from "drizzle-orm";
import type { AppDatabase } from "../db/types.js";
import { zones } from "../db/schema.js";

function rowToZone(row: typeof zones.$inferSelect): Zone {
  return {
    id: row.id,
    name: row.name,
    geojson: ZoneGeoJsonSchema.parse(JSON.parse(row.geojson)),
  };
}

/** Read all restricted zone rows from SQLite. */
export function listZoneRows(database: AppDatabase): Zone[] {
  return database.select().from(zones).all().map(rowToZone);
}

/** Insert a restricted zone row and return the persisted record. */
export function insertZone(
  input: CreateZoneRequest,
  database: AppDatabase,
): Zone {
  const inserted = database
    .insert(zones)
    .values({
      name: input.name,
      geojson: JSON.stringify(input.geojson),
    })
    .returning()
    .get();

  return rowToZone(inserted);
}

/** Delete a restricted zone row by primary key. Returns false when missing. */
export function deleteZoneById(id: number, database: AppDatabase): boolean {
  const result = database.delete(zones).where(eq(zones.id, id)).run();

  return result.changes > 0;
}
