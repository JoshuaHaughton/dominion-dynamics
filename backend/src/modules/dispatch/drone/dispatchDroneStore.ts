import type { DispatchDroneState } from "../types.js";

const dispatchDrones = new Map<string, DispatchDroneState>();
let nextDispatchCallsignNumber = 1;

/** Human-readable label for airport-launched dispatch drones (`Dispatch-1`, …). */
export function issueDispatchCallsign(): string {
  const callsign = `Dispatch-${nextDispatchCallsignNumber}`;
  nextDispatchCallsignNumber += 1;
  return callsign;
}

/** Read one dispatch drone sim state by id. */
export function getDispatchDroneState(
  droneId: string,
): DispatchDroneState | undefined {
  return dispatchDrones.get(droneId);
}

/** Replace one dispatch drone sim state. */
export function setDispatchDroneState(
  droneId: string,
  state: DispatchDroneState,
): void {
  dispatchDrones.set(droneId, state);
}

/** All dispatch drone states keyed by drone id. */
export function getDispatchDroneStates(): ReadonlyMap<
  string,
  DispatchDroneState
> {
  return dispatchDrones;
}

/** Remove one dispatch drone slot after despawn or patrol handoff. */
export function deleteDispatchDroneState(droneId: string): void {
  dispatchDrones.delete(droneId);
}

/** Clear dispatch drone state and reset callsign numbering (tests / shutdown). */
export function clearDispatchDroneStates(): void {
  dispatchDrones.clear();
  nextDispatchCallsignNumber = 1;
}

/** True when the patrol asset is owned by the dispatch movement layer this tick. */
export function isPatrolOnDispatchMission(droneId: string): boolean {
  return dispatchDrones.has(droneId);
}
