import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { afterEach, describe, expect, it } from "vitest";
import * as schema from "../db/schema.js";
import { findAllZones, insertZone } from "./zoneRepository.js";

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

describe("zoneRepository", () => {
  let sqlite: Database.Database | undefined;

  afterEach(() => {
    sqlite?.close();
    sqlite = undefined;
  });

  it("inserts and reads persisted zones", () => {
    const { database, sqlite: testSqlite } = createTestDb();
    sqlite = testSqlite;

    const created = insertZone(
      { name: "Zone 1", geojson: validPolygon },
      database,
    );

    expect(created.id).toBeTypeOf("number");
    expect(created.name).toBe("Zone 1");
    expect(created.geojson).toEqual(validPolygon);
    expect(findAllZones(database)).toEqual([created]);
  });
});
