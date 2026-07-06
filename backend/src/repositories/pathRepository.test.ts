import type Database from "better-sqlite3";
import { afterEach, describe, expect, it } from "vitest";
import { PATROL_ASSET_ID } from "@dominion-dynamics/shared";
import { ottawaPatrolPathOpen } from "@dominion-dynamics/shared/testing";
import { createTestDb } from "../testFixtures/db.js";
import { findPatrolPathRecord, savePatrolPath } from "./pathRepository.js";

describe("pathRepository", () => {
  const validLine = ottawaPatrolPathOpen();

  let sqlite: Database.Database | undefined;

  afterEach(() => {
    sqlite?.close();
    sqlite = undefined;
  });

  it("returns null when no patrol path is stored", () => {
    const { database, sqlite: testSqlite } = createTestDb();
    sqlite = testSqlite;

    expect(findPatrolPathRecord(database)).toBeNull();
  });

  it("saves and reads the singleton patrol path", () => {
    const { database, sqlite: testSqlite } = createTestDb();
    sqlite = testSqlite;

    const saved = savePatrolPath(validLine, database);

    expect(saved.kind).toBe("patrol");
    expect(saved.geojson).toEqual(validLine);
    expect(saved.assignedDroneId).toBe(PATROL_ASSET_ID);
    expect(findPatrolPathRecord(database)).toEqual(saved);
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

    expect(updated.geojson).toEqual(updatedLine);
    expect(findPatrolPathRecord(database)?.id).toBe(updated.id);
  });
});
