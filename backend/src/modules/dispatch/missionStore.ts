import type { DispatchMission } from "./types.js";

const missions = new Map<string, DispatchMission>();

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

/** Replace the full mission map (allocator output). */
export function setDispatchMissions(next: Map<string, DispatchMission>): void {
  missions.clear();

  for (const [targetId, mission] of next) {
    missions.set(targetId, mission);
  }
}

/** List all active dispatch missions. */
export function listDispatchMissions(): DispatchMission[] {
  return [...missions.values()];
}

/** Remove one mission when the target clears or the scramble ends. */
export function deleteDispatchMission(targetId: string): void {
  missions.delete(targetId);
}

/** Clear all missions (tests / shutdown). */
export function clearDispatchMissions(): void {
  missions.clear();
}

/** Critical target ids with an active dispatch mission this tick. */
export function getDispatchMissionTargetIds(): ReadonlySet<string> {
  return new Set(missions.keys());
}
