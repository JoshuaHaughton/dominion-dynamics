import { PATROL_ASSET_ID } from "@dominion-dynamics/shared";
import type { Asset } from "@dominion-dynamics/shared";
import { db } from "../../db/index.js";
import type { AppDatabase } from "../../db/types.js";
import {
  resolvePatrolPathGeoJson,
  resolvePatrolPathId,
} from "../../services/patrol/patrolPathService.js";
import { createInitialPatrolDroneState } from "./createInitialPatrolDroneState.js";
import { getPatrolDroneState, setPatrolDroneState } from "./droneStore.js";
import { advancePatrolDrone } from "./advancePatrolDrone.js";
import { patrolAssetFromState } from "./toWireAsset.js";

/** Place the patrol drone at the start of the saved route. */
export function resetPatrolDrone(database: AppDatabase = db): void {
  const geojson = resolvePatrolPathGeoJson(database);

  if (!geojson) return;

  setPatrolDroneState(
    PATROL_ASSET_ID,
    createInitialPatrolDroneState(geojson, resolvePatrolPathId(database)),
  );
}

/** Advance patrol one tick against enriched traffic, or null when no route is saved. */
export function tickPatrolDrone(
  liveAssets: readonly Asset[],
  deltaSeconds: number,
  database: AppDatabase = db,
): Asset | null {
  const geojson = resolvePatrolPathGeoJson(database);

  if (!geojson) {
    return null;
  }

  const pathId = resolvePatrolPathId(database);
  const current =
    getPatrolDroneState(PATROL_ASSET_ID) ??
    createInitialPatrolDroneState(geojson, pathId);

  const next = advancePatrolDrone({
    state: { ...current, pathId: pathId ?? current.pathId },
    path: geojson,
    liveAssets,
    deltaSeconds,
  });

  setPatrolDroneState(PATROL_ASSET_ID, next);

  return patrolAssetFromState(next);
}
