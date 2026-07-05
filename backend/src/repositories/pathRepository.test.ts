import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { afterEach, describe, expect, it } from "vitest";
import * as schema from "../db/schema.js";
import {
  getPatrolPath,
  getPathById,
  listPaths,
  savePatrolPath,
} from "./pathRepository.js";

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

describe("pathRepository", () => {
  const validLine = {
    type: "Feature" as const,
    properties: {},
    geometry: {
      type: "LineString" as const,
      coordinates: [
        [-75.8, 45.3],
        [-75.6, 45.35],
        [-75.5, 45.45],
      ],
    },
  };

  let sqlite: Database.Database | undefined;

  afterEach(() => {
    sqlite?.close();
    sqlite = undefined;
  });

  it("returns null when no patrol path is stored", () => {
    const { database, sqlite: testSqlite } = createTestDb();
    sqlite = testSqlite;

    expect(getPatrolPath(database)).toBeNull();
  });

  it("saves and reads the singleton patrol path", () => {
    const { database, sqlite: testSqlite } = createTestDb();
    sqlite = testSqlite;

    const saved = savePatrolPath(validLine, database);

    expect(saved.kind).toBe("patrol");
    expect(saved.geojson).toEqual(validLine);
    expect(saved.assignedDroneId).toBe("patrol-drone");
    expect(getPatrolPath(database)?.geojson).toEqual(validLine);
    expect(getPathById(saved.id, database)).toEqual(saved);
    expect(listPaths(database, "patrol")).toEqual([saved]);
  });

  it("updates the existing patrol path on save", () => {
    const { database, sqlite: testSqlite } = createTestDb();
    sqlite = testSqlite;

    savePatrolPath(validLine, database);

    const updatedLine = {
      ...validLine,
      geometry: {
        ...validLine.geometry,
        coordinates: [
          [-75.7, 45.32],
          [-75.55, 45.4],
        ],
      },
    };

    const updated = savePatrolPath(updatedLine, database);

    expect(listPaths(database, "patrol")).toHaveLength(1);
    expect(updated.geojson).toEqual(updatedLine);
  });
});
