import type { Asset, PathGeoJson } from "@dominion-dynamics/shared";
import { distanceM } from "../../lib/geo/distanceAndHeading.js";
import { lonLatFromPosition } from "../../lib/geo/position.js";
import { resolveApproachSpeedMps } from "../../lib/motion/approachSpeed.js";
import { isCriticalTrafficAsset } from "../threat/criticalTraffic.js";
import {
  PATROL_DRONE_SPEED_MPS,
  PATROL_APPROACH_DECEL_M,
  PATROL_MAX_INTERCEPT_MPS,
  PATROL_WAYPOINT_ARRIVAL_M,
} from "./constants.js";
import { isClosedPatrolPath } from "./pathGeometry.js";
import { getDispatchMission } from "../dispatch/missionStore.js";
import { capSpeedForRemainingDistance } from "./shadowChase.js";
import { advanceChaseTowardTarget, stepDroneTowardPoint } from "./chaseStep.js";
import {
  withPatrolCruiseKinematics,
  withRejoinKinematics,
} from "./kinematics.js";
import { beginRejoin } from "./rejoinToPath.js";
import type { PatrolDroneState } from "./types.js";

/** Ramp toward waypoints/snap points with patrol arrival + decel bands. */
function resolveApproachSpeed(
  distanceToTargetM: number,
  cruiseSpeed: number,
  maxSpeed: number,
  deltaSeconds: number,
): number {
  return resolveApproachSpeedMps({
    distanceM: distanceToTargetM,
    arrivalM: PATROL_WAYPOINT_ARRIVAL_M,
    decelM: PATROL_APPROACH_DECEL_M,
    deltaSeconds,
    maxSpeed,
    arrivalCapSpeed: cruiseSpeed,
    bandFloorSpeed: cruiseSpeed,
  });
}

function stepTowardTarget(
  state: PatrolDroneState,
  targetLon: number,
  targetLat: number,
  deltaSeconds: number,
): Asset {
  return stepDroneTowardPoint(state.asset, targetLon, targetLat, deltaSeconds);
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

function advancePatrolAlongPath(
  state: PatrolDroneState,
  path: PathGeoJson,
  deltaSeconds: number,
): PatrolDroneState {
  const coordinates = path.geometry.coordinates;
  const target = lonLatFromPosition(
    coordinates[state.targetWaypointIndex] ?? coordinates[0],
  );

  if (!target) {
    // Empty path — schema forbids this, but don't advance if it happens.
    return state;
  }

  const { lon: targetLon, lat: targetLat } = target;
  const distanceToWaypointM = distanceM(
    state.asset.lon,
    state.asset.lat,
    targetLon,
    targetLat,
  );
  const approachSpeed = resolveApproachSpeed(
    distanceToWaypointM,
    PATROL_DRONE_SPEED_MPS,
    PATROL_DRONE_SPEED_MPS,
    deltaSeconds,
  );
  const cruising = {
    ...state,
    asset: {
      ...withPatrolCruiseKinematics(state.asset),
      speed: capSpeedForRemainingDistance(
        approachSpeed,
        distanceToWaypointM,
        deltaSeconds,
        0,
      ),
    },
  };

  const moved = stepTowardTarget(cruising, targetLon, targetLat, deltaSeconds);

  const arrivalDistanceM = distanceM(
    moved.lon,
    moved.lat,
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

  const distanceToSnapM = distanceM(
    state.asset.lon,
    state.asset.lat,
    target.lon,
    target.lat,
  );
  const approachSpeed = resolveApproachSpeed(
    distanceToSnapM,
    PATROL_DRONE_SPEED_MPS,
    PATROL_MAX_INTERCEPT_MPS,
    deltaSeconds,
  );
  const rejoining = {
    ...state,
    asset: {
      ...withRejoinKinematics(state.asset),
      speed: capSpeedForRemainingDistance(
        approachSpeed,
        distanceToSnapM,
        deltaSeconds,
        0,
      ),
    },
  };
  const moved = stepTowardTarget(
    rejoining,
    target.lon,
    target.lat,
    deltaSeconds,
  );
  const arrivalDistanceM = distanceM(
    moved.lon,
    moved.lat,
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

/** Chase critical traffic — steer at the target when far, trail slot when close. */
function advanceShadowingTarget(
  state: PatrolDroneState,
  target: Asset,
  deltaSeconds: number,
): PatrolDroneState {
  const moved = advanceChaseTowardTarget(state.asset, target, deltaSeconds);

  return {
    ...state,
    mode: "shadow",
    shadowTargetId: target.id,
    rejoinTarget: null,
    asset: moved,
  };
}

/** A critical target is shadowable unless a dispatch drone already owns it. */
function isShadowableCritical(asset: Asset, patrolDroneId: string): boolean {
  const mission = getDispatchMission(asset.id);

  return mission === undefined || mission.droneId === patrolDroneId;
}

/**
 * Pick a shadow target: keep the current assignment when still critical,
 * otherwise claim the nearest unassigned critical asset.
 */
export function resolveShadowTarget(
  state: PatrolDroneState,
  liveAssets: readonly Asset[],
): Asset | null {
  const patrolDroneId = state.asset.id;

  if (state.shadowTargetId) {
    const current = liveAssets.find(
      (asset) => asset.id === state.shadowTargetId,
    );

    if (
      current &&
      isCriticalTrafficAsset(current) &&
      isShadowableCritical(current, patrolDroneId)
    ) {
      return current;
    }
  }

  let nearest: Asset | null = null;
  let nearestM = Infinity;

  for (const asset of liveAssets) {
    if (!isCriticalTrafficAsset(asset)) {
      continue;
    }

    if (!isShadowableCritical(asset, patrolDroneId)) {
      continue;
    }

    const assetDistanceM = distanceM(
      state.asset.lon,
      state.asset.lat,
      asset.lon,
      asset.lat,
    );

    if (assetDistanceM < nearestM) {
      nearestM = assetDistanceM;
      nearest = asset;
    }
  }

  return nearest;
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
  const shadowTarget = resolveShadowTarget(state, liveAssets);

  if (shadowTarget) {
    return advanceShadowingTarget(state, shadowTarget, deltaSeconds);
  }

  if (state.mode === "shadow") {
    return advanceRejoinTowardPath(
      beginRejoin(state, path),
      path,
      deltaSeconds,
    );
  }

  if (state.mode === "rejoin") {
    return advanceRejoinTowardPath(state, path, deltaSeconds);
  }

  return advancePatrolAlongPath(state, path, deltaSeconds);
}
