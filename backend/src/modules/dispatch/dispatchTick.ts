import type { Asset } from "@dominion-dynamics/shared";
import { PATROL_ASSET_ID } from "@dominion-dynamics/shared";
import { beginRejoin } from "../patrol/rejoinToPath.js";
import {
  getPatrolDroneState,
  setPatrolDroneState,
} from "../patrol/droneStore.js";
import type { ResolvedPatrolPath } from "../patrol/types.js";
import { advanceDispatchDrone } from "./advanceDispatchDrone.js";
import {
  deleteDispatchDroneState,
  getDispatchDroneStates,
  setDispatchDroneState,
} from "./dispatchDroneStore.js";
import { dispatchAssetFromState } from "./toWireAsset.js";

type TickDispatchDronesParams = {
  liveAssets: readonly Asset[];
  deltaSeconds: number;
  /** Resolved by the caller (ticker/bootstrap); modules never touch the DB. */
  patrolPath?: ResolvedPatrolPath | null;
};

/** Advance every dispatch drone and emit wire assets (excludes despawned units). */
export function tickDispatchDrones({
  liveAssets,
  deltaSeconds,
  patrolPath = null,
}: TickDispatchDronesParams): Asset[] {
  const wireAssets: Asset[] = [];

  for (const [droneId, state] of [...getDispatchDroneStates()]) {
    const result = advanceDispatchDrone({
      state,
      liveAssets,
      deltaSeconds,
    });

    if (result.kind === "despawn") {
      deleteDispatchDroneState(droneId);
      continue;
    }

    if (result.kind === "release_to_patrol") {
      deleteDispatchDroneState(droneId);
      handPatrolBackToRoute(result.asset, patrolPath);
      continue;
    }

    setDispatchDroneState(droneId, result.state);
    wireAssets.push(dispatchAssetFromState(result.state, liveAssets));
  }

  return wireAssets;
}

function handPatrolBackToRoute(
  asset: Asset,
  patrolPath: ResolvedPatrolPath | null,
): void {
  const existing = getPatrolDroneState(PATROL_ASSET_ID);

  if (!patrolPath || !existing) return;

  const rejoining = beginRejoin({ ...existing, asset }, patrolPath.geojson);

  setPatrolDroneState(PATROL_ASSET_ID, rejoining);
}
