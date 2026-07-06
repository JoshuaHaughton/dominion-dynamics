import type {
  PathGeoJson,
  SavePatrolPathRequest,
} from "@dominion-dynamics/shared";
import { db } from "../../db/index.js";
import type { AppDatabase } from "../../db/types.js";
import {
  findPatrolPathRecord,
  savePatrolPath as persistPatrolPath,
} from "../../repositories/pathRepository.js";
import type { ResolvedPatrolPath } from "../../modules/patrol/types.js";
import { DEFAULT_PATROL_PATH_GEOJSON } from "./defaultPatrolPath.js";

export type { ResolvedPatrolPath };

/** `undefined` = cache cold; `null` = no saved route. */
let cachedPatrolPath: ResolvedPatrolPath | null | undefined;

function loadPatrolPathFromDatabase(
  database: AppDatabase,
): ResolvedPatrolPath | null {
  const stored = findPatrolPathRecord(database);

  if (!stored) {
    return null;
  }

  return { id: stored.id, geojson: stored.geojson };
}

/** Drop the in-memory patrol route cache (tests / after external DB writes). */
export function clearPatrolPathCache(): void {
  cachedPatrolPath = undefined;
}

/** Persist a new patrol route (replaces any previous patrol path). */
export function savePatrolPath(
  input: SavePatrolPathRequest,
): ResolvedPatrolPath {
  const saved = persistPatrolPath(input.geojson, db);
  const resolved = { id: saved.id, geojson: saved.geojson };

  cachedPatrolPath = resolved;

  return resolved;
}

/** Seed the Ottawa demo oval when SQLite has no patrol route yet. */
export function ensureDefaultPatrolPath(): boolean {
  if (findPatrolPathRecord(db) !== null) {
    return false;
  }

  persistPatrolPath(DEFAULT_PATROL_PATH_GEOJSON, db);
  cachedPatrolPath = undefined;

  return true;
}

/** The saved patrol route (row id + geometry), or null when none exists. */
export function resolvePatrolPath(): ResolvedPatrolPath | null {
  if (cachedPatrolPath === undefined) {
    cachedPatrolPath = loadPatrolPathFromDatabase(db);
  }

  return cachedPatrolPath;
}

/** Test helper: load a patrol route from an isolated database. */
export function resolvePatrolPathFromDatabase(
  database: AppDatabase,
): ResolvedPatrolPath | null {
  return loadPatrolPathFromDatabase(database);
}

/** Test helper: persist a patrol route to an isolated database. */
export function savePatrolPathToDatabase(
  geojson: PathGeoJson,
  database: AppDatabase,
): ResolvedPatrolPath {
  const saved = persistPatrolPath(geojson, database);

  return { id: saved.id, geojson: saved.geojson };
}
