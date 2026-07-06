import type { DispatchMission } from "./types.js";

const missions = new Map<string, DispatchMission>();
let nextDispatchDroneIndex = 1;

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

/** Monotonic id source for airport-born dispatch drones (`dispatch-drone-1`, …). */
export function getNextDispatchDroneIndex(): number {
  return nextDispatchDroneIndex;
}

export function setNextDispatchDroneIndex(index: number): void {
  nextDispatchDroneIndex = index;
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

/** Clear missions and reset spawn id counter (tests / shutdown). */
export function clearDispatchMissions(): void {
  missions.clear();
  nextDispatchDroneIndex = 1;
}
