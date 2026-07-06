import type { Asset } from "@dominion-dynamics/shared";
import {
  filterAssignableDrones,
  minAssignableDroneDistanceM,
  selectDispatchSource,
} from "./selectDispatchSource.js";
import type {
  DispatchAssignmentDecision,
  DispatchDroneCandidate,
  DispatchMission,
  DispatchSyncResult,
} from "./types.js";

export type SyncDispatchMissionsParams = {
  criticalTargets: readonly Pick<Asset, "id" | "lat" | "lon">[];
  drones: readonly DispatchDroneCandidate[];
  missions: ReadonlyMap<string, DispatchMission>;
  nowMs: number;
};

function missionFromDecision(
  targetId: string,
  decision: DispatchAssignmentDecision,
  nowMs: number,
): DispatchMission {
  return {
    targetId,
    droneId: decision.droneId,
    assignmentSource: decision.type,
    homeAirportIdent:
      decision.type === "patrol" ? null : decision.homeAirportIdent,
    assignedAtMs: nowMs,
  };
}

function missionStillValid(
  mission: DispatchMission,
  criticalTargetIds: ReadonlySet<string>,
  drones: readonly DispatchDroneCandidate[],
): boolean {
  if (!criticalTargetIds.has(mission.targetId)) {
    return false;
  }

  const drone = drones.find(
    (candidate) => candidate.droneId === mission.droneId,
  );

  // Drop missions when the assigned drone no longer exists (despawn / reset).
  return drone !== undefined;
}

/**
 * Assign sticky dispatch missions for the current critical target set.
 *
 * 1. Keep valid existing missions (sticky) and reserve their drones.
 * 2. Release missions whose target cleared or whose drone despawned.
 * 3. Assign remaining criticals greedily, closest-to-help first when drones are scarce.
 */
export function syncDispatchMissions({
  criticalTargets,
  drones,
  missions,
  nowMs,
}: SyncDispatchMissionsParams): DispatchSyncResult {
  const criticalTargetIds = new Set(criticalTargets.map((target) => target.id));
  const nextMissions = new Map<string, DispatchMission>();
  const assignments: Array<{
    targetId: string;
    decision: DispatchAssignmentDecision;
  }> = [];

  const reservedDroneIds = new Set<string>();

  for (const [targetId, mission] of missions) {
    if (!missionStillValid(mission, criticalTargetIds, drones)) continue;

    nextMissions.set(targetId, mission);
    reservedDroneIds.add(mission.droneId);
  }

  const assignable = filterAssignableDrones(drones, reservedDroneIds);

  const unassignedCriticals = [...criticalTargets]
    .filter((target) => !nextMissions.has(target.id))
    .sort(
      (left, right) =>
        minAssignableDroneDistanceM(left, assignable) -
        minAssignableDroneDistanceM(right, assignable),
    );

  for (const target of unassignedCriticals) {
    const decision = selectDispatchSource({
      target,
      drones,
      reservedDroneIds,
    });

    const mission = missionFromDecision(target.id, decision, nowMs);

    nextMissions.set(target.id, mission);
    reservedDroneIds.add(decision.droneId);
    assignments.push({ targetId: target.id, decision });
  }

  return {
    missions: nextMissions,
    assignments,
  };
}
