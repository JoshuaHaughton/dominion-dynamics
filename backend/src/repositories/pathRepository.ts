import type { PathGeoJson, PathRecord } from "@dominion-dynamics/shared";
import {
  PATROL_ASSET_ID,
  PathGeoJsonSchema,
  PathKindSchema,
} from "@dominion-dynamics/shared";
import { eq } from "drizzle-orm";
import type { AppDatabase } from "../db/types.js";
import { paths } from "../db/schema.js";

function rowToPathRecord(row: typeof paths.$inferSelect): PathRecord {
  return {
    id: row.id,
    kind: PathKindSchema.parse(row.kind),
    label: row.label,
    geojson: PathGeoJsonSchema.parse(JSON.parse(row.geojson)),
    assignedDroneId: row.assignedDroneId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/** Read the persisted user patrol path row, if any. */
export function findPatrolPathRecord(
  database: AppDatabase,
): PathRecord | null {
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
  database: AppDatabase,
): PathRecord {
  const existing = findPatrolPathRecord(database);

  if (existing) {
    database
      .update(paths)
      .set({
        geojson: JSON.stringify(geojson),
        updatedAt: new Date(),
      })
      .where(eq(paths.id, existing.id))
      .run();

    return {
      ...existing,
      geojson,
      updatedAt: new Date().toISOString(),
    };
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
