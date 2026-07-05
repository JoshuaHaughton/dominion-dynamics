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

export type ResolvedPatrolPath = {
  id: number;
  geojson: PathGeoJson;
};

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

/** Read the saved patrol path row once for sim modules. */
export function resolvePatrolPath(
  database: AppDatabase = db,
): ResolvedPatrolPath | null {
  const stored = getStoredPatrolPath(database);

  if (!stored) return null;

  return { id: stored.id, geojson: stored.geojson };
}
