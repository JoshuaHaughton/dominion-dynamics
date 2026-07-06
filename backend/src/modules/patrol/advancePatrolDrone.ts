import type { Asset, PathGeoJson } from "@dominion-dynamics/shared";
import { isDrone } from "../sim/store.js";
import { distanceM } from "../../lib/geo/distanceAndHeading.js";
import {
  PATROL_DRONE_ALT_M,
  PATROL_DRONE_SPEED_MPS,
  PATROL_APPROACH_DECEL_M,
  PATROL_MAX_INTERCEPT_MPS,
  PATROL_WAYPOINT_ARRIVAL_M,
} from "./constants.js";
import { isClosedPatrolPath } from "./pathGeometry.js";
import { projectOntoPatrolPath } from "./pathProjection.js";
import { getDispatchMission } from "../dispatch/missionStore.js";
import {
  deleteShadowAssignment,
  getShadowDroneId,
  setShadowAssignment,
} from "./shadowAssignmentStore.js";
import {
  capSpeedForRemainingDistance,
} from "./shadowChase.js";
import {
  advanceChaseTowardTarget,
  stepDroneTowardPoint,
} from "./chaseStep.js";
import type { PatrolDroneState, PatrolPathDirection } from "./types.js";

/**
 * Ramp speed down near waypoints and rejoin snap points.
 * At max intercept speed one tick can travel farther than the arrival radius,
 * so without braking the drone overshoots and oscillates.
 */
function resolveApproachSpeed(
  distanceM: number,
  cruiseSpeed: number,
  maxSpeed: number,
  deltaSeconds: number,
): number {
  if (distanceM <= PATROL_WAYPOINT_ARRIVAL_M) {
    return Math.min(cruiseSpeed, distanceM / deltaSeconds);
  }

  if (distanceM >= PATROL_APPROACH_DECEL_M) {
    return maxSpeed;
  }

  const blend =
    (distanceM - PATROL_WAYPOINT_ARRIVAL_M) /
    (PATROL_APPROACH_DECEL_M - PATROL_WAYPOINT_ARRIVAL_M);

  // Linear interpolation: blend from cruise (close) to max (far) across the decel band.
  return lerp(cruiseSpeed, maxSpeed, clamp(blend, 0, 1));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function isCriticalTrafficAsset(asset: Asset): boolean {
  return !isDrone(asset) && asset.zone?.threat === "critical";
}

function stepTowardTarget(
  state: PatrolDroneState,
  targetLon: number,
  targetLat: number,
  deltaSeconds: number,
): Asset {
  return stepDroneTowardPoint(
    state.asset,
    targetLon,
    targetLat,
    deltaSeconds,
  );
}

/** Nearest critical traffic asset to the patrol drone, if any. */
export function findNearestCriticalAsset(
  drone: Pick<Asset, "lat" | "lon">,
  assets: readonly Asset[],
): Asset | null {
  let nearest: Asset | null = null;
  let nearestM = Infinity;

  for (const asset of assets) {
    if (isDrone(asset) || asset.zone?.threat !== "critical") {
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

function withPatrolCruiseKinematics(asset: Asset): Asset {
  return {
    ...asset,
    speed: PATROL_DRONE_SPEED_MPS,
    alt: PATROL_DRONE_ALT_M,
  };
}

/** Fly back to the route at max intercept speed after shadow ends. */
function withRejoinKinematics(asset: Asset): Asset {
  return {
    ...asset,
    speed: PATROL_MAX_INTERCEPT_MPS,
    alt: PATROL_DRONE_ALT_M,
  };
}

export function beginRejoin(state: PatrolDroneState, path: PathGeoJson): PatrolDroneState {
  if (state.shadowTargetId) {
    deleteShadowAssignment(state.shadowTargetId);
  }

  const projection = projectOntoPatrolPath(state.asset, path);

  if (projection.distanceM <= PATROL_WAYPOINT_ARRIVAL_M) {
    return {
      ...state,
      mode: "patrol",
      shadowTargetId: null,
      rejoinTarget: null,
      targetWaypointIndex: projection.targetWaypointIndex,
      asset: withPatrolCruiseKinematics(state.asset),
    };
  }

  return {
    ...state,
    mode: "rejoin",
    shadowTargetId: null,
    rejoinTarget: { lon: projection.lon, lat: projection.lat },
    targetWaypointIndex: projection.targetWaypointIndex,
    asset: withRejoinKinematics(state.asset),
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
  const moved = stepTowardTarget(rejoining, target.lon, target.lat, deltaSeconds);
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

/** Chase critical traffic — lead when far, trail slot when close. */
function advanceShadowingTarget(
  state: PatrolDroneState,
  target: Asset,
  deltaSeconds: number,
): PatrolDroneState {
  setShadowAssignment(target.id, state.asset.id);

  const moved = advanceChaseTowardTarget(state.asset, target, deltaSeconds);

  return {
    ...state,
    mode: "shadow",
    shadowTargetId: target.id,
    rejoinTarget: null,
    asset: moved,
  };
}

function isShadowableCritical(
  asset: Asset,
  patrolDroneId: string,
): boolean {
  const mission = getDispatchMission(asset.id);

  if (mission !== undefined && mission.droneId !== patrolDroneId) {
    return false;
  }

  const owner = getShadowDroneId(asset.id);

  return owner === undefined || owner === patrolDroneId;
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
    const current = liveAssets.find((asset) => asset.id === state.shadowTargetId);

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
