import type { Asset } from "@dominion-dynamics/shared";
import type { DispatchDroneState } from "./types.js";

/** Merge dispatch sim fields onto the wire asset for WS snapshots. */
export function dispatchAssetFromState(state: DispatchDroneState): Asset {
  const { asset, origin, phase, targetId, homeAirportIdent } = state;

  return {
    ...asset,
    role: "drone",
    zone: null,
    drone: {
      origin,
      dispatch: {
        targetId: targetId ?? "",
        phase,
        homeAirportIdent: homeAirportIdent ?? "",
      },
    },
  };
}
