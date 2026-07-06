import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { afterEach, describe, expect, it } from "vitest";
import * as schema from "../../db/schema.js";
import { clearZoneGeometryCache, getCachedZones } from "../../modules/threat/zoneGeometryCache.js";
import { createZone, deleteZone, listZones } from "./zoneService.js";

function createTestDb(): {
  database: BetterSQLite3Database<typeof schema>;
  sqlite: Database.Database;
} {
  const sqlite = new Database(":memory:");

  sqlite.exec(`
    CREATE TABLE zones (
      id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      name text NOT NULL,
      geojson text NOT NULL,
      created_at integer NOT NULL DEFAULT (unixepoch())
    );
  `);

  return {
    sqlite,
    database: drizzle(sqlite, { schema }),
  };
}

describe("zoneService", () => {
  const validPolygon = {
    type: "Feature" as const,
    properties: {},
    geometry: {
      type: "Polygon" as const,
      coordinates: [
        [
          [-75.8, 45.3],
          [-75.6, 45.3],
          [-75.6, 45.45],
          [-75.8, 45.45],
          [-75.8, 45.3],
        ],
      ],
    },
  };

  let sqlite: Database.Database | undefined;

  afterEach(() => {
    sqlite?.close();
    sqlite = undefined;
    clearZoneGeometryCache();
  });

  it("creates a zone and appends it to the geometry cache", () => {
    const { database, sqlite: testSqlite } = createTestDb();
    sqlite = testSqlite;

    const created = createZone(
      { name: "Zone 1", geojson: validPolygon },
      database,
    );

    expect(listZones(database)).toEqual([created]);
    expect(getCachedZones()).toHaveLength(1);
    expect(getCachedZones()[0]?.id).toBe(created.id);
  });

  it("deletes a zone and removes it from the geometry cache", () => {
    const { database, sqlite: testSqlite } = createTestDb();
    sqlite = testSqlite;

    const created = createZone(
      { name: "Zone 1", geojson: validPolygon },
      database,
    );

    expect(deleteZone(created.id, database)).toBe(true);
    expect(listZones(database)).toEqual([]);
    expect(getCachedZones()).toHaveLength(0);
  });
});
