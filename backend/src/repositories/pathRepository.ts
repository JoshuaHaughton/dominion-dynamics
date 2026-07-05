import type { PathGeoJson, PathKind, PathRecord } from "@dominion-dynamics/shared";
import { PATROL_ASSET_ID } from "@dominion-dynamics/shared";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { paths } from "../db/schema.js";
import type { AppDatabase } from "../db/types.js";

function rowToPathRecord(row: typeof paths.$inferSelect): PathRecord {
  return {
    id: row.id,
    kind: row.kind as PathKind,
    label: row.label,
    geojson: JSON.parse(row.geojson) as PathGeoJson,
    assignedDroneId: row.assignedDroneId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/** Read the persisted user patrol path, if any. */
export function getPatrolPath(database: AppDatabase = db): PathRecord | null {
  const row = database
    .select()
    .from(paths)
    .where(eq(paths.kind, "patrol"))
    .get();

  return row ? rowToPathRecord(row) : null;
}

/** Replace the singleton user patrol path row. */
export function savePatrolPath(
  geojson: PathGeoJson,
  database: AppDatabase = db,
): PathRecord {
  const existing = getPatrolPath(database);

  if (existing) {
    database
      .update(paths)
      .set({
        geojson: JSON.stringify(geojson),
        updatedAt: new Date(),
      })
      .where(eq(paths.id, existing.id))
      .run();

    return getPatrolPath(database)!;
  }

  const inserted = database
    .insert(paths)
    .values({
      kind: "patrol",
      label: "User patrol",
      geojson: JSON.stringify(geojson),
      assignedDroneId: PATROL_ASSET_ID,
    })
    .returning()
    .get();

  return rowToPathRecord(inserted);
}

/** Read one path row by primary key. */
export function getPathById(
  id: number,
  database: AppDatabase = db,
): PathRecord | null {
  const row = database.select().from(paths).where(eq(paths.id, id)).get();

  return row ? rowToPathRecord(row) : null;
}

/** List persisted paths, optionally filtered by kind. */
export function listPaths(
  database: AppDatabase = db,
  kind?: PathKind,
): PathRecord[] {
  const rows = kind
    ? database.select().from(paths).where(eq(paths.kind, kind)).all()
    : database.select().from(paths).all();

  return rows.map(rowToPathRecord);
}
