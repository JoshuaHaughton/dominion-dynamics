import type { Asset, DispatchPhase } from "@dominion-dynamics/shared";
import { findAirportByIdent } from "../airport/registry.js";
import {
  isTrailingTarget,
  resolveChaseSteerPoint,
} from "../patrol/shadow/shadowChase.js";

const DISPATCH_CHASE_PHASES = new Set<DispatchPhase>([
  "enroute",
  "intercepting",
  "trailing",
]);

type ResolvePredictionLineEndParams = {
  asset: Asset;
  shadowTarget: Asset | null;
  dispatchTarget: Asset | null;
  rejoinTarget: Pick<Asset, "lon" | "lat"> | null | undefined;
};

function chasePredictionEnd(
  drone: Asset,
  target: Asset,
  phase?: DispatchPhase,
): Pick<Asset, "lon" | "lat"> {
  if (phase === "trailing" || isTrailingTarget(drone, target)) {
    return { lon: target.lon, lat: target.lat };
  }

  return resolveChaseSteerPoint(drone, target);
}

/**
 * Fixed prediction endpoint for the selected asset track overlay.
 * Dispatch chase/RTB and patrol shadow/rejoin draw to a destination point.
 */
export function resolvePredictionLineEnd({
  asset,
  shadowTarget,
  dispatchTarget,
  rejoinTarget,
}: ResolvePredictionLineEndParams): Pick<Asset, "lon" | "lat"> | undefined {
  const dispatch = asset.drone?.dispatch;

  if (dispatch?.phase === "rtb" && dispatch.homeAirportIdent.length > 0) {
    const airport = findAirportByIdent(dispatch.homeAirportIdent);

    if (airport) {
      return { lon: airport.lon, lat: airport.lat };
    }
  }

  if (dispatch && DISPATCH_CHASE_PHASES.has(dispatch.phase) && dispatchTarget) {
    return chasePredictionEnd(asset, dispatchTarget, dispatch.phase);
  }

  if (shadowTarget) {
    return chasePredictionEnd(asset, shadowTarget);
  }

  if (asset.drone?.patrol?.mode === "rejoin" && rejoinTarget) {
    return rejoinTarget;
  }

  return undefined;
}
