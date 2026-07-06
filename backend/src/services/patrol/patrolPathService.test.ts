import type Database from "better-sqlite3";
import { afterEach, describe, expect, it } from "vitest";
import { ottawaPatrolPathOpen } from "@dominion-dynamics/shared/testing";
import { createTestDb } from "../../testFixtures/db.js";
import {
  clearPatrolPathCache,
  resolvePatrolPathFromDatabase,
  savePatrolPathToDatabase,
} from "./patrolPathService.js";

describe("patrolPathService", () => {
  const customLine = ottawaPatrolPathOpen();

  let sqlite: Database.Database | undefined;

  afterEach(() => {
    sqlite?.close();
    sqlite = undefined;
    clearPatrolPathCache();
  });

  it("returns null when nothing is stored", () => {
    const { database, sqlite: testSqlite } = createTestDb();
    sqlite = testSqlite;

    expect(resolvePatrolPathFromDatabase(database)).toBeNull();
  });

  it("persists and returns a saved patrol path", () => {
    const { database, sqlite: testSqlite } = createTestDb();
    sqlite = testSqlite;

    const saved = savePatrolPathToDatabase(customLine, database);

    expect(saved.geojson).toEqual(customLine);
    expect(resolvePatrolPathFromDatabase(database)?.geojson).toEqual(customLine);
  });
});
