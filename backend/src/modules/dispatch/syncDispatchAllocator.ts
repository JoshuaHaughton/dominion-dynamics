import type { Asset } from "@dominion-dynamics/shared";
import { isDrone } from "../sim/store.js";
import { syncDispatchMissions } from "./allocator.js";
import {
  buildDispatchDroneCandidates,
  resolveExistingAssetForAssignment,
} from "./buildDispatchDroneCandidate.js";
import { applyDispatchAssignment } from "./createDispatchDrone.js";
import { setDispatchDroneState } from "./dispatchDroneStore.js";
import {
  getDispatchMissionMap,
  setDispatchMissions,
} from "./missionStore.js";

/** Traffic targets that need a dispatch assignment this tick. */
function extractCriticalTargets(
  liveAssets: readonly Asset[],
): Array<Pick<Asset, "id" | "lat" | "lon">> {
  return liveAssets
    .filter(
      (asset) => !isDrone(asset) && asset.zone?.threat === "critical",
    )
    .map((asset) => ({
      id: asset.id,
      lat: asset.lat,
      lon: asset.lon,
    }));
}

/** Invert mission store for candidate busy/available lookup by drone id. */
function missionByDroneIdFromStore(): Map<string, string> {
  const missionByDroneId = new Map<string, string>();

  for (const mission of getDispatchMissionMap().values()) {
    missionByDroneId.set(mission.droneId, mission.targetId);
  }

  return missionByDroneId;
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
  const missionByDroneId = missionByDroneIdFromStore();
  const candidates = buildDispatchDroneCandidates(missionByDroneId);

  const result = syncDispatchMissions({
    criticalTargets,
    drones: candidates,
    missions: getDispatchMissionMap(),
    nowMs,
  });

  setDispatchMissions(result.missions);

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

    const existingAsset = resolveExistingAssetForAssignment(
      decision.droneId,
      [],
    );
    const state = applyDispatchAssignment(
      mission,
      decision,
      target,
      existingAsset,
    );

    setDispatchDroneState(state.asset.id, state);
  }
}
