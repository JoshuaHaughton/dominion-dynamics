import type { Asset } from "@dominion-dynamics/shared";
import { getAirportByIdent } from "../airport/registry.js";
import type { DispatchDroneState } from "./types.js";

/** Merge dispatch sim fields onto the wire asset for WS snapshots. */
export function dispatchAssetFromState(state: DispatchDroneState): Asset {
  const { asset, origin, phase, targetId, homeAirportIdent } = state;
  const homeIdent = homeAirportIdent ?? "";
  const homeAirport = homeIdent ? getAirportByIdent(homeIdent) : undefined;

  return {
    ...asset,
    role: "drone",
    zone: null,
    drone: {
      origin,
      dispatch: {
        targetId: targetId ?? "",
        phase,
        homeAirportIdent: homeIdent,
        homeAirportName: homeAirport?.name,
      },
    },
  };
}
