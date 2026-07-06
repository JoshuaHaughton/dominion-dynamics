import type { DispatchSyncResult } from "./types.js";
import type { DispatchMission } from "./types.js";

const missions = new Map<string, DispatchMission>();
const missionByDroneId = new Map<string, string>();

function removeMission(targetId: string): void {
  const mission = missions.get(targetId);

  if (!mission) {
    return;
  }

  missions.delete(targetId);

  if (missionByDroneId.get(mission.droneId) === targetId) {
    missionByDroneId.delete(mission.droneId);
  }
}

function upsertMission(targetId: string, mission: DispatchMission): void {
  const previous = missions.get(targetId);

  if (previous && previous.droneId !== mission.droneId) {
    if (missionByDroneId.get(previous.droneId) === targetId) {
      missionByDroneId.delete(previous.droneId);
    }
  }

  missions.set(targetId, mission);
  missionByDroneId.set(mission.droneId, targetId);
}

/** Read the sticky mission for a critical target, if any. */
export function getDispatchMission(
  targetId: string,
): DispatchMission | undefined {
  return missions.get(targetId);
}

/** Snapshot of all sticky missions keyed by critical target id. */
export function getDispatchMissionMap(): ReadonlyMap<string, DispatchMission> {
  return missions;
}

/** Active mission target for a drone id, when assigned. */
export function getDispatchMissionTargetForDrone(
  droneId: string,
): string | undefined {
  return missionByDroneId.get(droneId);
}

/** In-place sync from allocator output (delete stale, upsert sticky + new). */
export function applyDispatchSyncResult(result: DispatchSyncResult): void {
  const nextTargetIds = new Set(result.missions.keys());

  for (const targetId of [...missions.keys()]) {
    if (!nextTargetIds.has(targetId)) {
      removeMission(targetId);
    }
  }

  for (const [targetId, mission] of result.missions) {
    upsertMission(targetId, mission);
  }
}

/** List all active dispatch missions. */
export function listDispatchMissions(): DispatchMission[] {
  return [...missions.values()];
}

/** Clear all missions (tests / shutdown). */
export function clearDispatchMissions(): void {
  missions.clear();
  missionByDroneId.clear();
}
