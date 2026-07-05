import bearing from "@turf/bearing";
import distance from "@turf/distance";
import { point } from "@turf/helpers";
import type { Asset, PathGeoJson } from "@dominion-dynamics/shared";
import { stepAsset } from "../sim/movement.js";
import { PATROL_WAYPOINT_ARRIVAL_M } from "./constants.js";
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

function isPatrolAsset(asset: Asset): boolean {
  return asset.role === "patrol";
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

/** Index of the path vertex closest to the drone (for rejoin after shadow). */
export function nearestWaypointIndex(
  drone: Pick<Asset, "lat" | "lon">,
  path: PathGeoJson,
): number {
  const coordinates = path.geometry.coordinates;
  let bestIndex = 0;
  let bestM = Infinity;

  for (let index = 0; index < coordinates.length; index += 1) {
    const [lon, lat] = coordinates[index]!;
    const vertexDistanceM = distanceM(drone.lon, drone.lat, lon, lat);

    if (vertexDistanceM < bestM) {
      bestM = vertexDistanceM;
      bestIndex = index;
    }
  }

  return bestIndex;
}

function nextSegmentIndex(
  currentIndex: number,
  vertexCount: number,
): number {
  return (currentIndex + 1) % vertexCount;
}

function advancePatrolAlongPath(
  state: PatrolDroneState,
  path: PathGeoJson,
  deltaSeconds: number,
): PatrolDroneState {
  const coordinates = path.geometry.coordinates;
  const target = coordinates[state.segmentIndex]!;
  const [targetLon, targetLat] = target;
  const heading = turfBearingToHeading(
    bearing(
      point([state.asset.lon, state.asset.lat]),
      point([targetLon, targetLat]),
    ),
  );

  const moved = stepAsset({
    asset: { ...state.asset, heading },
    deltaSeconds,
  });

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
    segmentIndex,
    asset: moved,
  };
}

function advanceShadowingTarget(
  state: PatrolDroneState,
  target: Asset,
  deltaSeconds: number,
): PatrolDroneState {
  const heading = turfBearingToHeading(
    bearing(
      point([state.asset.lon, state.asset.lat]),
      point([target.lon, target.lat]),
    ),
  );

  const moved = stepAsset({
    asset: { ...state.asset, heading },
    deltaSeconds,
  });

  return {
    ...state,
    mode: "shadow",
    shadowTargetId: target.id,
    asset: moved,
  };
}

/**
 * Advance the patrol drone one sim tick.
 * PATROL follows path waypoints; SHADOW chases the nearest critical asset.
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
    return advanceShadowingTarget(state, shadowTarget, deltaSeconds);
  }

  if (state.mode === "shadow") {
    const rejoinIndex = nearestWaypointIndex(state.asset, path);

    return advancePatrolAlongPath(
      {
        ...state,
        mode: "patrol",
        shadowTargetId: null,
        segmentIndex: nextSegmentIndex(
          rejoinIndex,
          path.geometry.coordinates.length,
        ),
      },
      path,
      deltaSeconds,
    );
  }

  return advancePatrolAlongPath(state, path, deltaSeconds);
}
