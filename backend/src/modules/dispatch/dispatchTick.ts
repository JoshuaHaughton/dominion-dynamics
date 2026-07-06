import type { Asset } from "@dominion-dynamics/shared";
import { PATROL_ASSET_ID } from "@dominion-dynamics/shared";
import { beginRejoin } from "../patrol/advancePatrolDrone.js";
import {
  getPatrolDroneState,
  setPatrolDroneState,
} from "../patrol/droneStore.js";
import { resolvePatrolPath } from "../../services/patrol/patrolPathService.js";
import type { AppDatabase } from "../../db/types.js";
import { db } from "../../db/index.js";
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
  database?: AppDatabase;
};

/** Advance every dispatch drone and emit wire assets (excludes despawned units). */
export function tickDispatchDrones({
  liveAssets,
  deltaSeconds,
  database = db,
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
      handPatrolBackToRoute(result.asset, database);
      continue;
    }

    setDispatchDroneState(droneId, result.state);
    wireAssets.push(dispatchAssetFromState(result.state, liveAssets));
  }

  return wireAssets;
}

function handPatrolBackToRoute(asset: Asset, database: AppDatabase): void {
  const resolved = resolvePatrolPath(database);
  const existing = getPatrolDroneState(PATROL_ASSET_ID);

  if (!resolved || !existing) {
    return;
  }

  const rejoining = beginRejoin(
    {
      ...existing,
      asset,
      mode: "shadow",
      shadowTargetId: null,
    },
    resolved.geojson,
  );

  setPatrolDroneState(PATROL_ASSET_ID, rejoining);
}
