import type { PathGeoJson } from "@dominion-dynamics/shared";
import { headingToward } from "../../lib/geo/distanceAndHeading.js";
import {
  PATROL_DRONE_ALT_M,
  PATROL_DRONE_SPEED_MPS,
  PATROL_MAX_INTERCEPT_MPS,
  PATROL_WAYPOINT_ARRIVAL_M,
} from "./constants.js";
import { projectOntoPatrolPath } from "./pathProjection.js";
import type { PatrolDroneState } from "./types.js";

function withPatrolCruiseKinematics(
  asset: PatrolDroneState["asset"],
): PatrolDroneState["asset"] {
  return {
    ...asset,
    speed: PATROL_DRONE_SPEED_MPS,
    alt: PATROL_DRONE_ALT_M,
  };
}

function withRejoinKinematics(
  asset: PatrolDroneState["asset"],
): PatrolDroneState["asset"] {
  return {
    ...asset,
    speed: PATROL_MAX_INTERCEPT_MPS,
    alt: PATROL_DRONE_ALT_M,
  };
}

/**
 * Keep the drone at its current position when the route changes; snap patrol
 * state onto the new polyline instead of resetting to vertex zero.
 */
export function realignPatrolDroneToPath(
  state: PatrolDroneState,
  path: PathGeoJson,
  pathId: number | null,
): PatrolDroneState {
  const projection = projectOntoPatrolPath(state.asset, path);
  const targetCoordinate = path.geometry.coordinates[projection.targetWaypointIndex]!;
  const [targetLon, targetLat] =
    projection.distanceM <= PATROL_WAYPOINT_ARRIVAL_M
      ? targetCoordinate
      : [projection.lon, projection.lat];

  const onPath = projection.distanceM <= PATROL_WAYPOINT_ARRIVAL_M;

  return {
    ...state,
    mode: onPath ? "patrol" : "rejoin",
    pathId,
    pathDirection: "forward",
    shadowTargetId: null,
    targetWaypointIndex: projection.targetWaypointIndex,
    rejoinTarget: onPath
      ? null
      : { lon: projection.lon, lat: projection.lat },
    asset: {
      ...(onPath
        ? withPatrolCruiseKinematics(state.asset)
        : withRejoinKinematics(state.asset)),
      heading: headingToward(
        state.asset.lon,
        state.asset.lat,
        targetLon,
        targetLat,
      ),
    },
  };
}
