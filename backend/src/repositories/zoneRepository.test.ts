import type Database from "better-sqlite3";
import { afterEach, describe, expect, it } from "vitest";
import { ottawaZonePolygon } from "@dominion-dynamics/shared/testing";
import { createTestDb } from "../testFixtures/db.js";
import { listZoneRows, insertZone } from "./zoneRepository.js";

describe("zoneRepository", () => {
  const validPolygon = ottawaZonePolygon();

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
    expect(listZoneRows(database)).toEqual([created]);
  });
});
