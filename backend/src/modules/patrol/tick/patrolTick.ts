import { PATROL_ASSET_ID } from "@dominion-dynamics/shared";
import type { Asset } from "@dominion-dynamics/shared";
import { createInitialPatrolDroneState } from "./createInitialPatrolDroneState.js";
import { realignPatrolDroneToPath } from "../path/realignPatrolDroneToPath.js";
import {
  deletePatrolDroneState,
  getPatrolDroneState,
  setPatrolDroneState,
} from "../store/droneStore.js";
import { advancePatrolDrone } from "./advancePatrolDrone.js";
import { patrolAssetFromState } from "../wire/toWireAsset.js";
import { isPatrolOnDispatchMission } from "../../dispatch/drone/dispatchDroneStore.js";
import type { ResolvedPatrolPath } from "../types.js";

/** Place the patrol drone at the start of the given route, or clear it when none exists. */
export function initializePatrolDrone(
  patrolPath: ResolvedPatrolPath | null,
): void {
  if (!patrolPath) {
    deletePatrolDroneState(PATROL_ASSET_ID);
    return;
  }

  const existing = getPatrolDroneState(PATROL_ASSET_ID);

  // Keep position on route replace; only spawn at vertex zero on first save.
  setPatrolDroneState(
    PATROL_ASSET_ID,
    existing
      ? realignPatrolDroneToPath(existing, patrolPath.geojson, patrolPath.id)
      : createInitialPatrolDroneState(patrolPath.geojson, patrolPath.id),
  );
}

type TickPatrolDroneParams = {
  liveAssets: readonly Asset[];
  deltaSeconds: number;
  /** Resolved by the caller (ticker/bootstrap); modules never touch the DB. */
  patrolPath: ResolvedPatrolPath | null;
};

/** Advance patrol one tick against enriched traffic, or null when no route is saved. */
export function tickPatrolDrone({
  liveAssets,
  deltaSeconds,
  patrolPath,
}: TickPatrolDroneParams): Asset | null {
  if (isPatrolOnDispatchMission(PATROL_ASSET_ID)) {
    return null;
  }

  if (!patrolPath) {
    return null;
  }

  const current =
    getPatrolDroneState(PATROL_ASSET_ID) ??
    createInitialPatrolDroneState(patrolPath.geojson, patrolPath.id);

  const next = advancePatrolDrone({
    state: { ...current, pathId: patrolPath.id },
    path: patrolPath.geojson,
    liveAssets,
    deltaSeconds,
  });

  setPatrolDroneState(PATROL_ASSET_ID, next);

  return patrolAssetFromState(next);
}
