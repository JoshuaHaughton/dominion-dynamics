import type { Asset } from "@dominion-dynamics/shared";
import { findAirportByIdent } from "../../airport/registry.js";
import { droneWireAsset } from "../../drones/droneWireAsset.js";
import { computeInterceptEtaSeconds } from "../drone/computeInterceptEta.js";
import type { DispatchDroneState } from "../types.js";

/** Merge dispatch sim fields onto the wire asset for WS snapshots. */
export function dispatchAssetFromState(
  state: DispatchDroneState,
  liveAssets: readonly Asset[] = [],
): Asset {
  const { asset, origin, phase, targetId, homeAirportIdent } = state;
  const homeIdent = homeAirportIdent ?? "";
  const homeAirport = homeIdent ? findAirportByIdent(homeIdent) : undefined;
  const target =
    targetId !== null
      ? liveAssets.find((candidate) => candidate.id === targetId)
      : undefined;

  return droneWireAsset(asset, {
    origin,
    dispatch: {
      targetId: targetId ?? "",
      phase,
      homeAirportIdent: homeIdent,
      homeAirportName: homeAirport?.name,
      interceptEtaSeconds: computeInterceptEtaSeconds(asset, target, phase),
    },
  });
}
