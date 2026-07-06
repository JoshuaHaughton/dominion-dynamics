import { PATROL_ASSET_ID } from "@dominion-dynamics/shared";
import type { Asset } from "@dominion-dynamics/shared";
import { getPatrolDroneState } from "../../patrol/store/droneStore.js";
import {
  getDispatchDroneState,
  getDispatchDroneStates,
} from "../drone/dispatchDroneStore.js";
import type { DispatchDroneCandidate, DispatchDroneState } from "../types.js";

/** Dispatch-owned patrol drone; no `patrol` field — it is not on its route. */
function patrolCandidateFromState(
  state: DispatchDroneState,
  missionTargetId: string | null,
): DispatchDroneCandidate {
  return {
    droneId: state.asset.id,
    lat: state.asset.lat,
    lon: state.asset.lon,
    origin: "patrol",
    availability: missionTargetId ? "busy" : "available",
    missionTargetId,
    homeAirportIdent: null,
  };
}

function dispatchCandidateFromState(
  state: DispatchDroneState,
  missionTargetId: string | null,
): DispatchDroneCandidate {
  return {
    droneId: state.asset.id,
    lat: state.asset.lat,
    lon: state.asset.lon,
    origin: "dispatch",
    availability: missionTargetId ? "busy" : "available",
    missionTargetId,
    homeAirportIdent: state.homeAirportIdent,
  };
}

/** Map live sim state into allocator-facing drone candidates. */
export function buildDispatchDroneCandidates(
  missionTargetForDrone: (droneId: string) => string | undefined,
): DispatchDroneCandidate[] {
  const candidates: DispatchDroneCandidate[] = [];

  const patrolState = getPatrolDroneState(PATROL_ASSET_ID);

  if (patrolState && !getDispatchDroneState(PATROL_ASSET_ID)) {
    const patrolMissionTargetId = missionTargetForDrone(PATROL_ASSET_ID) ?? null;

    candidates.push({
      droneId: PATROL_ASSET_ID,
      lat: patrolState.asset.lat,
      lon: patrolState.asset.lon,
      origin: "patrol",
      patrol: { mode: patrolState.mode },
      availability: patrolMissionTargetId ? "busy" : "available",
      missionTargetId: patrolMissionTargetId,
      homeAirportIdent: null,
    });
  }

  for (const state of getDispatchDroneStates().values()) {
    const missionTargetId = missionTargetForDrone(state.asset.id) ?? null;

    if (state.origin === "patrol") {
      candidates.push(patrolCandidateFromState(state, missionTargetId));
      continue;
    }

    candidates.push(dispatchCandidateFromState(state, missionTargetId));
  }

  return candidates;
}

/** Resolve the live asset backing a dispatch assignment decision. */
export function resolveExistingAssetForAssignment(
  droneId: string,
): Asset | undefined {
  const dispatchState = getDispatchDroneState(droneId);

  if (dispatchState) {
    return dispatchState.asset;
  }

  if (droneId === PATROL_ASSET_ID) {
    return getPatrolDroneState(PATROL_ASSET_ID)?.asset;
  }

  return undefined;
}
