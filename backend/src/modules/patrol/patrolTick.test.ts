import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { afterEach, describe, expect, it } from "vitest";
import * as schema from "../../db/schema.js";
import { savePatrolPath } from "../../services/patrol/patrolPathService.js";
import { clearPatrolDroneStates, getPatrolDroneState } from "./droneStore.js";
import { initializePatrolDrone, tickPatrolDrone } from "./patrolTick.js";
import { PATROL_ASSET_ID } from "@dominion-dynamics/shared";

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

describe("patrolTick", () => {
  const customLine = {
    type: "Feature" as const,
    properties: {},
    geometry: {
      type: "LineString" as const,
      coordinates: [
        [-75.8, 45.3],
        [-75.7, 45.35],
        [-75.6, 45.4],
      ],
    },
  };

  let sqlite: Database.Database | undefined;

  afterEach(() => {
    sqlite?.close();
    sqlite = undefined;
    clearPatrolDroneStates();
  });

  it("does nothing when no patrol path is saved", () => {
    const { database, sqlite: testSqlite } = createTestDb();
    sqlite = testSqlite;

    initializePatrolDrone(database);

    expect(getPatrolDroneState(PATROL_ASSET_ID)).toBeUndefined();
    expect(tickPatrolDrone({ liveAssets: [], deltaSeconds: 1, database })).toBeNull();
  });

  it("initializes the patrol drone at the saved route start", () => {
    const { database, sqlite: testSqlite } = createTestDb();
    sqlite = testSqlite;

    savePatrolPath({ geojson: customLine }, database);
    initializePatrolDrone(database);

    const state = getPatrolDroneState(PATROL_ASSET_ID);

    expect(state?.asset.role).toBe("patrol");
    expect(state?.mode).toBe("patrol");
    expect(state?.asset.zone).toBeNull();
  });

  it("returns a patrol wire asset that moves on tick", () => {
    const { database, sqlite: testSqlite } = createTestDb();
    sqlite = testSqlite;

    savePatrolPath({ geojson: customLine }, database);
    initializePatrolDrone(database);

    const first = tickPatrolDrone({ liveAssets: [], deltaSeconds: 1, database });
    const second = tickPatrolDrone({ liveAssets: [], deltaSeconds: 1, database });

    expect(first?.id).toBe(PATROL_ASSET_ID);
    expect(first?.role).toBe("patrol");
    expect(first?.patrol?.mode).toBe("patrol");
    expect(second?.lat).not.toBe(first?.lat);
  });
});
