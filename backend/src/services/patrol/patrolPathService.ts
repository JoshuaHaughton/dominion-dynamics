import type {
  PatrolPath,
  PathGeoJson,
  SavePatrolPathRequest,
} from "@dominion-dynamics/shared";
import { db } from "../../db/index.js";
import type { AppDatabase } from "../../db/types.js";
import { buildDefaultPatrolPath } from "../../modules/patrol/buildDefaultPatrolPath.js";
import { simConfig } from "../../modules/sim/config.js";
import {
  getPatrolPath as getStoredPatrolPath,
  savePatrolPath as persistPatrolPath,
} from "../../repositories/pathRepository.js";

/** Active patrol route: saved path or the demo oval inside the seed region. */
export function getPatrolPath(database: AppDatabase = db): PatrolPath {
  const stored = getStoredPatrolPath(database);

  return {
    geojson: stored?.geojson ?? buildDefaultPatrolPath(simConfig.seedRegion),
  };
}

/** Persist a new patrol route (replaces any previous patrol path). */
export function savePatrolPath(
  input: SavePatrolPathRequest,
  database: AppDatabase = db,
): PatrolPath {
  const saved = persistPatrolPath(input.geojson, database);

  return { geojson: saved.geojson };
}

/** Patrol path coordinates for sim modules (no API wrapper). */
export function resolvePatrolPathGeoJson(
  database: AppDatabase = db,
): PathGeoJson {
  return getPatrolPath(database).geojson;
}

/** Stored patrol path row id, if the user has saved a patrol route. */
export function resolvePatrolPathId(database: AppDatabase = db): number | null {
  return getStoredPatrolPath(database)?.id ?? null;
}
