import type Database from "better-sqlite3";
import { afterEach, describe, expect, it } from "vitest";
import { ottawaZonePolygon } from "@dominion-dynamics/shared/testing";
import {
  clearZoneGeometryCache,
  getCachedZones,
  appendZoneToCache,
  removeZoneFromCache,
} from "../../modules/threat/zone/zoneGeometryCache.js";
import { createTestDb } from "../../testFixtures/db.js";
import {
  deleteZoneById,
  insertZone,
  listZoneRows,
} from "../../repositories/zoneRepository.js";

describe("zoneService", () => {
  const validPolygon = ottawaZonePolygon();

  let sqlite: Database.Database | undefined;

  afterEach(() => {
    sqlite?.close();
    sqlite = undefined;
    clearZoneGeometryCache();
  });

  it("creates a zone and appends it to the geometry cache", () => {
    const { database, sqlite: testSqlite } = createTestDb();
    sqlite = testSqlite;

    const created = insertZone(
      { name: "Zone 1", geojson: validPolygon },
      database,
    );
    appendZoneToCache(created);

    expect(listZoneRows(database)).toEqual([created]);
    expect(getCachedZones()).toHaveLength(1);
    expect(getCachedZones()[0]?.id).toBe(created.id);
  });

  it("deletes a zone and removes it from the geometry cache", () => {
    const { database, sqlite: testSqlite } = createTestDb();
    sqlite = testSqlite;

    const created = insertZone(
      { name: "Zone 1", geojson: validPolygon },
      database,
    );
    appendZoneToCache(created);

    expect(deleteZoneById(created.id, database)).toBe(true);
    removeZoneFromCache(created.id);

    expect(listZoneRows(database)).toEqual([]);
    expect(getCachedZones()).toHaveLength(0);
  });
});
