import type { CreateZoneRequest, Zone } from "@dominion-dynamics/shared";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { db } from "../db/index.js";
import * as schema from "../db/schema.js";
import { zones } from "../db/schema.js";

type Database = BetterSQLite3Database<typeof schema>;

/** Read all restricted zones from SQLite. */
export function getZones(database: Database = db): Zone[] {
  const rows = database.select().from(zones).all();

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    geojson: JSON.parse(row.geojson) as Zone["geojson"],
  }));
}

/** Insert a restricted zone and return the persisted row. */
export function createZone(
  input: CreateZoneRequest,
  database: Database = db,
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
