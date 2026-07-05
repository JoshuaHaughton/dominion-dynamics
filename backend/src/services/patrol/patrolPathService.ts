import type {
  PatrolPath,
  PathGeoJson,
  SavePatrolPathRequest,
} from "@dominion-dynamics/shared";
import { db } from "../../db/index.js";
import type { AppDatabase } from "../../db/types.js";
import {
  getPatrolPath as getStoredPatrolPath,
  savePatrolPath as persistPatrolPath,
} from "../../repositories/pathRepository.js";

/** Saved user patrol route, if any. */
export function getPatrolPath(database: AppDatabase = db): PatrolPath | null {
  const stored = getStoredPatrolPath(database);

  if (!stored) return null;

  return { geojson: stored.geojson };
}

/** Persist a new patrol route (replaces any previous patrol path). */
export function savePatrolPath(
  input: SavePatrolPathRequest,
  database: AppDatabase = db,
): PatrolPath {
  const saved = persistPatrolPath(input.geojson, database);

  return { geojson: saved.geojson };
}

/** Patrol path coordinates for sim modules when a route has been saved. */
export function resolvePatrolPathGeoJson(
  database: AppDatabase = db,
): PathGeoJson | null {
  return getStoredPatrolPath(database)?.geojson ?? null;
}

/** Stored patrol path row id, if the user has saved a patrol route. */
export function resolvePatrolPathId(database: AppDatabase = db): number | null {
  return getStoredPatrolPath(database)?.id ?? null;
}
