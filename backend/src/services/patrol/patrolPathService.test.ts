import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { afterEach, describe, expect, it } from "vitest";
import * as schema from "../../db/schema.js";
import { buildDefaultPatrolPath } from "../../modules/patrol/buildDefaultPatrolPath.js";
import { SIM_SEED_REGION } from "../../modules/sim/config.js";
import { getPatrolPath, savePatrolPath } from "./patrolPathService.js";

function createTestDb(): {
  database: BetterSQLite3Database<typeof schema>;
  sqlite: Database.Database;
} {
  const sqlite = new Database(":memory:");

  sqlite.exec(`
    CREATE TABLE paths (
      id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      kind text NOT NULL,
      label text,
      geojson text NOT NULL,
      assigned_drone_id text,
      created_at integer NOT NULL DEFAULT (unixepoch()),
      updated_at integer NOT NULL DEFAULT (unixepoch())
    );
  `);

  return {
    sqlite,
    database: drizzle(sqlite, { schema }),
  };
}

describe("patrolPathService", () => {
  const customLine = {
    type: "Feature" as const,
    properties: {},
    geometry: {
      type: "LineString" as const,
      coordinates: [
        [-75.8, 45.3],
        [-75.6, 45.35],
      ],
    },
  };

  let sqlite: Database.Database | undefined;

  afterEach(() => {
    sqlite?.close();
    sqlite = undefined;
  });

  it("returns the default oval when nothing is stored", () => {
    const { database, sqlite: testSqlite } = createTestDb();
    sqlite = testSqlite;

    const path = getPatrolPath(database);

    expect(path.geojson.geometry.type).toBe("LineString");
    expect(path.geojson.geometry.coordinates.length).toBeGreaterThanOrEqual(2);
    expect(path.geojson).toEqual(buildDefaultPatrolPath(SIM_SEED_REGION));
  });

  it("persists and returns a saved patrol path", () => {
    const { database, sqlite: testSqlite } = createTestDb();
    sqlite = testSqlite;

    const saved = savePatrolPath({ geojson: customLine }, database);

    expect(saved.geojson).toEqual(customLine);
    expect(getPatrolPath(database).geojson).toEqual(customLine);
  });
});
