import type { Asset } from "@dominion-dynamics/shared";
import type { PatrolDroneState } from "./types.js";

/** Merge sim patrol fields onto the wire asset for WS snapshots. */
export function patrolAssetFromState(state: PatrolDroneState): Asset {
  return {
    ...state.asset,
    role: "drone",
    zone: null,
    drone: {
      origin: "patrol",
      patrol: {
        mode: state.mode,
        shadowTargetId: state.shadowTargetId,
        ...(state.pathId !== null ? { pathId: state.pathId } : {}),
      },
    },
  };
}
