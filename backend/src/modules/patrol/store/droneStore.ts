import type { PatrolDroneState } from "../types.js";

const patrolDrones = new Map<string, PatrolDroneState>();

/** Read one patrol drone sim state by id. */
export function getPatrolDroneState(
  droneId: string,
): PatrolDroneState | undefined {
  return patrolDrones.get(droneId);
}

/** Replace one patrol drone sim state. */
export function setPatrolDroneState(
  droneId: string,
  state: PatrolDroneState,
): void {
  patrolDrones.set(droneId, state);
}

/** All patrol drone states keyed by drone id. */
export function getPatrolDroneStates(): ReadonlyMap<string, PatrolDroneState> {
  return patrolDrones;
}

/** Remove one patrol drone from the in-memory store. */
export function deletePatrolDroneState(droneId: string): void {
  patrolDrones.delete(droneId);
}

/** Clear patrol drone state (tests / shutdown). */
export function clearPatrolDroneStates(): void {
  patrolDrones.clear();
}
