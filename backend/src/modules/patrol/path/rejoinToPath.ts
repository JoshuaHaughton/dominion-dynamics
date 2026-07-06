import type { PathGeoJson } from "@dominion-dynamics/shared";
import { PATROL_WAYPOINT_ARRIVAL_M } from "../constants.js";
import {
  withPatrolCruiseKinematics,
  withRejoinKinematics,
} from "../shadow/kinematics.js";
import { projectOntoPatrolPath } from "./pathProjection.js";
import type { PatrolDroneState } from "../types.js";

/**
 * End any shadow and snap patrol state onto the path: resume patrol when
 * within the arrival radius, otherwise fly to the nearest snap point.
 */
export function beginRejoin(
  state: PatrolDroneState,
  path: PathGeoJson,
): PatrolDroneState {
  const projection = projectOntoPatrolPath(state.asset, path);
  const onPath = projection.distanceM <= PATROL_WAYPOINT_ARRIVAL_M;

  return {
    ...state,
    mode: onPath ? "patrol" : "rejoin",
    shadowTargetId: null,
    rejoinTarget: onPath ? null : { lon: projection.lon, lat: projection.lat },
    targetWaypointIndex: projection.targetWaypointIndex,
    asset: onPath
      ? withPatrolCruiseKinematics(state.asset)
      : withRejoinKinematics(state.asset),
  };
}
