import type { Asset, DispatchPhase } from "@dominion-dynamics/shared";
import {
  formatDispatchBaseLabel,
  formatDispatchFocusField,
  formatDispatchFocusValue,
  formatDispatchPhase,
  resolveAssetLabel,
} from "./dispatchDisplayUtils.js";

export type InterceptMission = {
  droneId: string;
  droneLabel: string;
  focusFieldLabel: string;
  focusLabel: string;
  phase: DispatchPhase;
  phaseLabel: string;
  baseLabel: string;
};

/** Active auto-dispatch missions from the latest live asset snapshot. */
export function getActiveInterceptMissions(
  assets: readonly Asset[],
): InterceptMission[] {
  const missions: InterceptMission[] = [];

  for (const asset of assets) {
    const dispatch = asset.drone?.dispatch;

    if (dispatch === undefined) {
      continue;
    }

    const origin = asset.drone?.origin ?? "dispatch";

    missions.push({
      droneId: asset.id,
      droneLabel: resolveAssetLabel(asset.id, assets),
      focusFieldLabel: formatDispatchFocusField(dispatch.phase),
      focusLabel: formatDispatchFocusValue(
        dispatch.phase,
        dispatch.targetId,
        dispatch.homeAirportIdent,
        assets,
        origin,
      ),
      phase: dispatch.phase,
      phaseLabel: formatDispatchPhase(dispatch.phase),
      baseLabel: formatDispatchBaseLabel(origin, dispatch.homeAirportIdent),
    });
  }

  return missions;
}
