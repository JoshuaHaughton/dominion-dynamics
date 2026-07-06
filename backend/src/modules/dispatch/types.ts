import type { DroneOrigin } from "@dominion-dynamics/shared";

export type DispatchAssignmentSource = "spawn" | "reuse" | "patrol";

export type DispatchPatrolCandidateMode = "patrol" | "shadow" | "rejoin";

/** Sticky assignment of one drone to one critical traffic target. */
export type DispatchMission = {
  targetId: string;
  droneId: string;
  /** How the drone was sourced; drives post-mission return in the movement layer (S10.4). */
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
  | DispatchSpawnDecision
  | DispatchReuseDecision
  | DispatchPatrolDecision;

export type DispatchSyncResult = {
  missions: Map<string, DispatchMission>;
  releasedTargetIds: string[];
  assignments: Array<{
    targetId: string;
    decision: DispatchAssignmentDecision;
  }>;
  nextDispatchDroneIndex: number;
};
