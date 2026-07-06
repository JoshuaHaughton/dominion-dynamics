import type { Asset } from "@dominion-dynamics/shared";
import { droneWireAsset } from "../drones/droneWireAsset.js";
import type { PatrolDroneState } from "./types.js";

/** Merge sim patrol fields onto the wire asset for WS snapshots. */
export function patrolAssetFromState(state: PatrolDroneState): Asset {
  return droneWireAsset(state.asset, {
    origin: "patrol",
    patrol: {
      mode: state.mode,
      shadowTargetId: state.shadowTargetId,
      ...(state.pathId !== null ? { pathId: state.pathId } : {}),
    },
  });
}
