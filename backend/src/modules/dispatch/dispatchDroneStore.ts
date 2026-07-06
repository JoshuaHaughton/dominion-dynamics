import type { DispatchDroneState } from "./types.js";

const dispatchDrones = new Map<string, DispatchDroneState>();
let nextScramCallsignNumber = 1;

/** Human-readable label for spawned dispatch drones (`SCRAM1`, `SCRAM2`, …). */
export function issueScramCallsign(): string {
  const callsign = `SCRAM${nextScramCallsignNumber}`;
  nextScramCallsignNumber += 1;
  return callsign;
}

export function getDispatchDroneState(
  droneId: string,
): DispatchDroneState | undefined {
  return dispatchDrones.get(droneId);
}

export function setDispatchDroneState(
  droneId: string,
  state: DispatchDroneState,
): void {
  dispatchDrones.set(droneId, state);
}

export function getDispatchDroneStates(): ReadonlyMap<string, DispatchDroneState> {
  return dispatchDrones;
}

export function deleteDispatchDroneState(droneId: string): void {
  dispatchDrones.delete(droneId);
}

export function clearDispatchDroneStates(): void {
  dispatchDrones.clear();
  nextScramCallsignNumber = 1;
}

/** True when the patrol asset is owned by the dispatch movement layer this tick. */
export function isPatrolOnDispatchMission(droneId: string): boolean {
  return dispatchDrones.has(droneId);
}
