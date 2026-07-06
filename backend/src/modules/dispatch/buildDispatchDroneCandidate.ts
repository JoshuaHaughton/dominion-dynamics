import { PATROL_ASSET_ID } from "@dominion-dynamics/shared";
import type { Asset } from "@dominion-dynamics/shared";
import { getPatrolDroneState } from "../patrol/droneStore.js";
import {
  deleteDispatchDroneState,
  getDispatchDroneState,
  getDispatchDroneStates,
} from "./dispatchDroneStore.js";
import type { DispatchDroneCandidate, DispatchDroneState } from "./types.js";

function patrolCandidateFromState(
  state: DispatchDroneState,
  missionTargetId: string | null,
): DispatchDroneCandidate {
  return {
    droneId: state.asset.id,
    lat: state.asset.lat,
    lon: state.asset.lon,
    origin: "patrol",
    patrol: { mode: "rejoin" },
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
  missionByDroneId: ReadonlyMap<string, string>,
): DispatchDroneCandidate[] {
  const candidates: DispatchDroneCandidate[] = [];

  const patrolState = getPatrolDroneState(PATROL_ASSET_ID);

  if (patrolState && !getDispatchDroneState(PATROL_ASSET_ID)) {
    candidates.push({
      droneId: PATROL_ASSET_ID,
      lat: patrolState.asset.lat,
      lon: patrolState.asset.lon,
      origin: "patrol",
      patrol: { mode: patrolState.mode },
      availability: missionByDroneId.has(PATROL_ASSET_ID) ? "busy" : "available",
      missionTargetId: missionByDroneId.get(PATROL_ASSET_ID) ?? null,
      homeAirportIdent: null,
    });
  }

  for (const state of getDispatchDroneStates().values()) {
    const missionTargetId = missionByDroneId.get(state.asset.id) ?? null;

    if (state.origin === "patrol") {
      candidates.push(patrolCandidateFromState(state, missionTargetId));
      continue;
    }

    candidates.push(dispatchCandidateFromState(state, missionTargetId));
  }

  return candidates;
}

/** Whether a dispatch-born drone slot still exists in sim. */
export function dispatchDroneExists(droneId: string): boolean {
  return getDispatchDroneState(droneId)?.origin === "dispatch";
}

/** Resolve the live asset backing a dispatch assignment decision. */
export function resolveExistingAssetForAssignment(
  droneId: string,
  liveDrones: readonly Asset[],
): Asset | undefined {
  const dispatchState = getDispatchDroneState(droneId);

  if (dispatchState) {
    return dispatchState.asset;
  }

  if (droneId === PATROL_ASSET_ID) {
    return getPatrolDroneState(PATROL_ASSET_ID)?.asset;
  }

  return liveDrones.find((drone) => drone.id === droneId);
}

/** Remove a dispatch slot after despawn or patrol handoff. */
export function removeDispatchDrone(droneId: string): void {
  deleteDispatchDroneState(droneId);
}
