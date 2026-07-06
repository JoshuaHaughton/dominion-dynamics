import { PATROL_ASSET_ID } from "@dominion-dynamics/shared";
import type { Asset } from "@dominion-dynamics/shared";
import { db } from "../../db/index.js";
import type { AppDatabase } from "../../db/types.js";
import { resolvePatrolPath } from "../../services/patrol/patrolPathService.js";
import { createInitialPatrolDroneState } from "./createInitialPatrolDroneState.js";
import { realignPatrolDroneToPath } from "./realignPatrolDroneToPath.js";
import {
  deletePatrolDroneState,
  getPatrolDroneState,
  setPatrolDroneState,
} from "./droneStore.js";
import { advancePatrolDrone } from "./advancePatrolDrone.js";
import { patrolAssetFromState } from "./toWireAsset.js";

/** Place the patrol drone at the start of the saved route, or clear it when none exists. */
export function initializePatrolDrone(database: AppDatabase = db): void {
  const resolved = resolvePatrolPath(database);

  if (!resolved) {
    deletePatrolDroneState(PATROL_ASSET_ID);
    return;
  }

  const existing = getPatrolDroneState(PATROL_ASSET_ID);

  // Keep position on route replace; only spawn at vertex zero on first save.
  setPatrolDroneState(
    PATROL_ASSET_ID,
    existing
      ? realignPatrolDroneToPath(existing, resolved.geojson, resolved.id)
      : createInitialPatrolDroneState(resolved.geojson, resolved.id),
  );
}

type TickPatrolDroneParams = {
  liveAssets: readonly Asset[];
  deltaSeconds: number;
  database?: AppDatabase;
};

/** Advance patrol one tick against enriched traffic, or null when no route is saved. */
export function tickPatrolDrone({
  liveAssets,
  deltaSeconds,
  database = db,
}: TickPatrolDroneParams): Asset | null {
  const resolved = resolvePatrolPath(database);

  if (!resolved) {
    return null;
  }

  const current =
    getPatrolDroneState(PATROL_ASSET_ID) ??
    createInitialPatrolDroneState(resolved.geojson, resolved.id);

  const next = advancePatrolDrone({
    state: { ...current, pathId: resolved.id },
    path: resolved.geojson,
    liveAssets,
    deltaSeconds,
  });

  setPatrolDroneState(PATROL_ASSET_ID, next);

  return patrolAssetFromState(next);
}
