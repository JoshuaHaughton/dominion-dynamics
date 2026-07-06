import type { Asset } from "@dominion-dynamics/shared";
import { PATROL_ASSET_ID } from "@dominion-dynamics/shared";
import { isCriticalTrafficAsset } from "../threat/criticalTraffic.js";
import {
  getPatrolDroneState,
  setPatrolDroneState,
} from "../patrol/droneStore.js";
import { syncDispatchMissions } from "./allocator.js";
import {
  buildDispatchDroneCandidates,
  resolveExistingAssetForAssignment,
} from "./buildDispatchDroneCandidate.js";
import { applyDispatchAssignment } from "./createDispatchDrone.js";
import { setDispatchDroneState } from "./dispatchDroneStore.js";
import {
  applyDispatchSyncResult,
  getDispatchMissionMap,
  getDispatchMissionTargetForDrone,
} from "./missionStore.js";

/** Traffic targets that need a dispatch assignment this tick. */
function extractCriticalTargets(
  liveAssets: readonly Asset[],
): Array<Pick<Asset, "id" | "lat" | "lon">> {
  return liveAssets.filter(isCriticalTrafficAsset).map((asset) => ({
    id: asset.id,
    lat: asset.lat,
    lon: asset.lon,
  }));
}

/**
 * Reset the parked patrol sim state when the patrol drone takes a dispatch
 * mission. While dispatch owns the drone its patrol state is frozen; without
 * this reset a stale shadow claim survives the mission and resurfaces on release.
 */
function clearPatrolShadowState(): void {
  const patrolState = getPatrolDroneState(PATROL_ASSET_ID);
  if (!patrolState) return;

  setPatrolDroneState(PATROL_ASSET_ID, {
    ...patrolState,
    mode: "patrol",
    shadowTargetId: null,
    rejoinTarget: null,
  });
}

/**
 * Run the sticky allocator against enriched traffic and materialize new assignments
 * in the dispatch drone store before movement ticks.
 */
export function syncDispatchAllocator(
  enrichedTraffic: readonly Asset[],
  nowMs: number,
): void {
  const criticalTargets = extractCriticalTargets(enrichedTraffic);
  const candidates = buildDispatchDroneCandidates(getDispatchMissionTargetForDrone);

  const result = syncDispatchMissions({
    criticalTargets,
    drones: candidates,
    missions: getDispatchMissionMap(),
    nowMs,
  });

  applyDispatchSyncResult(result);

  // Apply only brand-new assignments; sticky missions keep their existing sim state.
  for (const { targetId, decision } of result.assignments) {
    const mission = result.missions.get(targetId);

    if (!mission) {
      continue;
    }

    const target = criticalTargets.find((entry) => entry.id === targetId);

    if (!target) {
      continue;
    }

    const existingAsset = resolveExistingAssetForAssignment(decision.droneId);
    const state = applyDispatchAssignment(
      mission,
      decision,
      target,
      existingAsset,
    );

    setDispatchDroneState(state.asset.id, state);

    if (state.asset.id === PATROL_ASSET_ID) clearPatrolShadowState();
  }
}
