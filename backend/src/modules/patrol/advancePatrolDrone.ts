import type { Asset, PathGeoJson } from "@dominion-dynamics/shared";
import { isPatrolAsset } from "../sim/store.js";
import { stepAsset } from "../sim/movement.js";
import { distanceM, headingToward } from "../../lib/geo/distanceAndHeading.js";
import { PATROL_WAYPOINT_ARRIVAL_M } from "./constants.js";
import { isClosedPatrolPath } from "./pathGeometry.js";
import { projectOntoPatrolPath } from "./pathProjection.js";
import type { PatrolDroneState, PatrolPathDirection } from "./types.js";

function stepTowardTarget(
  state: PatrolDroneState,
  targetLon: number,
  targetLat: number,
  deltaSeconds: number,
): Asset {
  const heading = headingToward(
    state.asset.lon,
    state.asset.lat,
    targetLon,
    targetLat,
  );

  return stepAsset({
    asset: { ...state.asset, heading },
    deltaSeconds,
  });
}

/** Nearest critical traffic asset to the patrol drone, if any. */
export function findNearestCriticalAsset(
  drone: Pick<Asset, "lat" | "lon">,
  assets: readonly Asset[],
): Asset | null {
  let nearest: Asset | null = null;
  let nearestM = Infinity;

  for (const asset of assets) {
    if (isPatrolAsset(asset) || asset.zone?.threat !== "critical") {
      continue;
    }

    const assetDistanceM = distanceM(drone.lon, drone.lat, asset.lon, asset.lat);

    if (assetDistanceM < nearestM) {
      nearestM = assetDistanceM;
      nearest = asset;
    }
  }

  return nearest;
}

function afterWaypointArrival(
  state: PatrolDroneState,
  path: PathGeoJson,
): Pick<PatrolDroneState, "targetWaypointIndex" | "pathDirection"> {
  const vertexCount = path.geometry.coordinates.length;
  const index = state.targetWaypointIndex;

  if (isClosedPatrolPath(path)) {
    return {
      targetWaypointIndex: (index + 1) % vertexCount,
      pathDirection: state.pathDirection,
    };
  }

  if (state.pathDirection === "forward") {
    if (index >= vertexCount - 1) {
      return {
        targetWaypointIndex: vertexCount - 2,
        pathDirection: "reverse",
      };
    }

    return {
      targetWaypointIndex: index + 1,
      pathDirection: "forward",
    };
  }

  if (index <= 0) {
    return {
      targetWaypointIndex: 1,
      pathDirection: "forward",
    };
  }

  return {
    targetWaypointIndex: index - 1,
    pathDirection: "reverse",
  };
}

function beginRejoin(state: PatrolDroneState, path: PathGeoJson): PatrolDroneState {
  const projection = projectOntoPatrolPath(state.asset, path);

  if (projection.distanceM <= PATROL_WAYPOINT_ARRIVAL_M) {
    return {
      ...state,
      mode: "patrol",
      shadowTargetId: null,
      rejoinTarget: null,
      targetWaypointIndex: projection.targetWaypointIndex,
    };
  }

  return {
    ...state,
    mode: "rejoin",
    shadowTargetId: null,
    rejoinTarget: { lon: projection.lon, lat: projection.lat },
    targetWaypointIndex: projection.targetWaypointIndex,
  };
}

function advancePatrolAlongPath(
  state: PatrolDroneState,
  path: PathGeoJson,
  deltaSeconds: number,
): PatrolDroneState {
  const coordinates = path.geometry.coordinates;
  const target = coordinates[state.targetWaypointIndex]!;
  const [targetLon, targetLat] = target;

  const moved = stepTowardTarget(state, targetLon, targetLat, deltaSeconds);

  const arrivalDistanceM = distanceM(
    state.asset.lon,
    state.asset.lat,
    targetLon,
    targetLat,
  );

  const waypointAdvance =
    arrivalDistanceM <= PATROL_WAYPOINT_ARRIVAL_M
      ? afterWaypointArrival(state, path)
      : {
          targetWaypointIndex: state.targetWaypointIndex,
          pathDirection: state.pathDirection,
        };

  return {
    ...state,
    mode: "patrol",
    shadowTargetId: null,
    rejoinTarget: null,
    ...waypointAdvance,
    asset: moved,
  };
}

function advanceRejoinTowardPath(
  state: PatrolDroneState,
  path: PathGeoJson,
  deltaSeconds: number,
): PatrolDroneState {
  const target = state.rejoinTarget;

  if (!target) {
    return advancePatrolAlongPath(state, path, deltaSeconds);
  }

  const moved = stepTowardTarget(state, target.lon, target.lat, deltaSeconds);
  const arrivalDistanceM = distanceM(
    state.asset.lon,
    state.asset.lat,
    target.lon,
    target.lat,
  );

  if (arrivalDistanceM <= PATROL_WAYPOINT_ARRIVAL_M) {
    return advancePatrolAlongPath(
      {
        ...state,
        mode: "patrol",
        rejoinTarget: null,
        asset: moved,
      },
      path,
      deltaSeconds,
    );
  }

  return {
    ...state,
    mode: "rejoin",
    asset: moved,
  };
}

function advanceShadowingTarget(
  state: PatrolDroneState,
  target: Asset,
  deltaSeconds: number,
): PatrolDroneState {
  const moved = stepTowardTarget(state, target.lon, target.lat, deltaSeconds);

  return {
    ...state,
    mode: "shadow",
    shadowTargetId: target.id,
    rejoinTarget: null,
    asset: moved,
  };
}

/**
 * Advance the patrol drone one sim tick.
 * SHADOW chases critical traffic; REJOIN flies to the path snap point; PATROL follows waypoints.
 */
export function advancePatrolDrone({
  state,
  path,
  liveAssets,
  deltaSeconds,
}: {
  state: PatrolDroneState;
  path: PathGeoJson;
  liveAssets: readonly Asset[];
  deltaSeconds: number;
}): PatrolDroneState {
  const shadowTarget = findNearestCriticalAsset(state.asset, liveAssets);

  if (shadowTarget) {
    // Critical traffic nearby — chase takes priority over the route.
    return advanceShadowingTarget(state, shadowTarget, deltaSeconds);
  }

  if (state.mode === "shadow") {
    // Shadow ended — snap onto the path, then fly back toward the route.
    return advanceRejoinTowardPath(beginRejoin(state, path), path, deltaSeconds);
  }

  if (state.mode === "rejoin") {
    // Fly toward the saved snap point until back on the path.
    return advanceRejoinTowardPath(state, path, deltaSeconds);
  }

  // Normal patrol — follow the next route waypoint.
  return advancePatrolAlongPath(state, path, deltaSeconds);
}
