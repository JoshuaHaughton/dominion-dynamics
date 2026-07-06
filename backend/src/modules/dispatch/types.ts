import type { DispatchPhase, DroneOrigin } from "@dominion-dynamics/shared";
import type { Asset } from "@dominion-dynamics/shared";

export type DispatchAssignmentSource = "spawn" | "reuse" | "patrol";

export type DispatchPatrolCandidateMode = "patrol" | "shadow" | "rejoin";

/** Sticky assignment of one drone to one critical traffic target. */
export type DispatchMission = {
  targetId: string;
  droneId: string;
  /** How the drone was sourced; determines RTB-to-airport vs patrol rejoin in `advanceDispatchDrone`. */
  assignmentSource: DispatchAssignmentSource;
  /** ICAO airport the drone lands at when the mission ends; null when a patrol drone rejoins its route. */
  homeAirportIdent: string | null;
  assignedAtMs: number;
};

/** Minimal drone view for allocation decisions (movement layer fills this in later). */
export type DispatchDroneCandidate = {
  droneId: string;
  lat: number;
  lon: number;
  origin: DroneOrigin;
  /** Mirrors wire `drone.patrol.mode` when origin is `"patrol"`. */
  patrol?: { mode: DispatchPatrolCandidateMode };
  /** Whether the drone may accept a new dispatch mission this tick. */
  availability: "available" | "busy";
  /** Active dispatch target when busy on a scramble mission. */
  missionTargetId: string | null;
  /** Dispatch home airport for origin `"dispatch"` drones when known. */
  homeAirportIdent?: string | null;
};

export type DispatchSpawnDecision = {
  type: "spawn";
  droneId: string;
  homeAirportIdent: string;
  spawnLat: number;
  spawnLon: number;
};

export type DispatchReuseDecision = {
  type: "reuse";
  droneId: string;
  /** Dispatch drone base when known; null for patrol drones returning to route. */
  homeAirportIdent: string | null;
};

export type DispatchPatrolDecision = {
  type: "patrol";
  droneId: string;
};

export type DispatchAssignmentDecision =
  DispatchSpawnDecision | DispatchReuseDecision | DispatchPatrolDecision;

export type DispatchSyncResult = {
  missions: Map<string, DispatchMission>;
  assignments: Array<{
    targetId: string;
    decision: DispatchAssignmentDecision;
  }>;
};

/** Runtime sim state for a drone executing a dispatch mission. */
export type DispatchDroneState = {
  phase: DispatchPhase;
  targetId: string | null;
  assignmentSource: DispatchAssignmentSource;
  /** ICAO airport for dispatch RTB; null when a diverted patrol drone rejoins its route. */
  homeAirportIdent: string | null;
  origin: DroneOrigin;
  asset: Asset;
};

export type AdvanceDispatchDroneResult =
  | { kind: "continue"; state: DispatchDroneState }
  | { kind: "despawn" }
  | { kind: "release_to_patrol"; asset: Asset };
