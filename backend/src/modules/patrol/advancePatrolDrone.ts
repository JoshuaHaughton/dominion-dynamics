import bearing from "@turf/bearing";
import distance from "@turf/distance";
import { point } from "@turf/helpers";
import type { Asset, PathGeoJson } from "@dominion-dynamics/shared";
import { isPatrolAsset } from "../sim/store.js";
import { stepAsset } from "../sim/movement.js";
import { PATROL_WAYPOINT_ARRIVAL_M } from "./constants.js";
import { projectOntoPatrolPath } from "./pathProjection.js";
import type { PatrolDroneState } from "./types.js";

/** Turf bearing is -180..180; asset heading is 0..360 clockwise from north. */
function turfBearingToHeading(bearingDeg: number): number {
  return (bearingDeg + 360) % 360;
}

/** Haversine distance in meters between two WGS84 points (via Turf). */
function distanceM(
  fromLon: number,
  fromLat: number,
  toLon: number,
  toLat: number,
): number {
  return (
    distance(point([fromLon, fromLat]), point([toLon, toLat]), {
      units: "kilometers",
    }) * 1000
  );
}

function headingToward(
  fromLon: number,
  fromLat: number,
  toLon: number,
  toLat: number,
): number {
  return turfBearingToHeading(
    bearing(point([fromLon, fromLat]), point([toLon, toLat])),
  );
}

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

/** Nearest critical asset to the patrol drone, if any. */
export function findNearestCriticalAsset(
  drone: Pick<Asset, "lat" | "lon">,
  assets: readonly Asset[],
): Asset | null {
  let nearest: Asset | null = null;
  let nearestM = Infinity;

  for (const asset of assets) {
    if (isPatrolAsset(asset) || asset.threat !== "critical") {
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

function nextSegmentIndex(
  currentIndex: number,
  vertexCount: number,
): number {
  return (currentIndex + 1) % vertexCount;
}

function beginRejoin(state: PatrolDroneState, path: PathGeoJson): PatrolDroneState {
  const projection = projectOntoPatrolPath(state.asset, path);

  if (projection.distanceM <= PATROL_WAYPOINT_ARRIVAL_M) {
    return {
      ...state,
      mode: "patrol",
      shadowTargetId: null,
      rejoinTarget: null,
      segmentIndex: projection.segmentIndex,
    };
  }

  return {
    ...state,
    mode: "rejoin",
    shadowTargetId: null,
    rejoinTarget: { lon: projection.lon, lat: projection.lat },
    segmentIndex: projection.segmentIndex,
  };
}

function advancePatrolAlongPath(
  state: PatrolDroneState,
  path: PathGeoJson,
  deltaSeconds: number,
): PatrolDroneState {
  const coordinates = path.geometry.coordinates;
  const target = coordinates[state.segmentIndex]!;
  const [targetLon, targetLat] = target;

  const moved = stepTowardTarget(state, targetLon, targetLat, deltaSeconds);

  const arrivalDistanceM = distanceM(
    state.asset.lon,
    state.asset.lat,
    targetLon,
    targetLat,
  );

  const segmentIndex =
    arrivalDistanceM <= PATROL_WAYPOINT_ARRIVAL_M
      ? nextSegmentIndex(state.segmentIndex, coordinates.length)
      : state.segmentIndex;

  return {
    ...state,
    mode: "patrol",
    shadowTargetId: null,
    rejoinTarget: null,
    segmentIndex,
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
 * SHADOW chases critical traffic; REJOIN flies to the path; PATROL follows waypoints.
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
