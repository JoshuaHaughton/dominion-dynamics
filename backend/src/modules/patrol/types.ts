import type { Asset, PatrolMode, PathGeoJson } from "@dominion-dynamics/shared";

export type PatrolPathDirection = "forward" | "reverse";

export type PatrolDroneState = {
  mode: PatrolMode;
  /** Index of the waypoint the drone is currently flying toward. */
  targetWaypointIndex: number;
  /** Forward along drawn order, or reverse when ping-ponging an open path. */
  pathDirection: PatrolPathDirection;
  shadowTargetId: string | null;
  pathId: number | null;
  /** Closest point on the path; fly here during rejoin before resuming waypoints. */
  rejoinTarget: { lon: number; lat: number } | null;
  asset: Asset;
};

export type AdvancePatrolDroneParams = {
  state: PatrolDroneState;
  path: PathGeoJson;
  liveAssets: readonly Asset[];
  deltaSeconds: number;
};
