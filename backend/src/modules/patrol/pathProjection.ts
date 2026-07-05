import distance from "@turf/distance";
import { point } from "@turf/helpers";
import type { Asset, PathGeoJson } from "@dominion-dynamics/shared";
import { isClosedPatrolPath, patrolPathSegmentCount } from "./pathGeometry.js";

export type PathProjection = {
  lon: number;
  lat: number;
  distanceM: number;
  /** Waypoint index to resume toward after rejoin intercepts the snap point. */
  targetWaypointIndex: number;
};

function closestPointOnSegment(
  pointLon: number,
  pointLat: number,
  startLon: number,
  startLat: number,
  endLon: number,
  endLat: number,
): { lon: number; lat: number } {
  const segmentLon = endLon - startLon;
  const segmentLat = endLat - startLat;
  const segmentLengthSq = segmentLon * segmentLon + segmentLat * segmentLat;

  if (segmentLengthSq === 0) {
    return { lon: startLon, lat: startLat };
  }

  const progress =
    ((pointLon - startLon) * segmentLon + (pointLat - startLat) * segmentLat) /
    segmentLengthSq;
  const clamped = Math.max(0, Math.min(1, progress));

  return {
    lon: startLon + clamped * segmentLon,
    lat: startLat + clamped * segmentLat,
  };
}

/**
 * Closest point on the patrol polyline and the waypoint to resume toward after rejoin.
 * Rejoin flies to lon/lat; targetWaypointIndex picks up vertex patrol afterward.
 */
export function projectOntoPatrolPath(
  drone: Pick<Asset, "lat" | "lon">,
  path: PathGeoJson,
): PathProjection {
  const coordinates = path.geometry.coordinates;
  const vertexCount = coordinates.length;
  const closed = isClosedPatrolPath(path);
  const segmentCount = patrolPathSegmentCount(path);
  const dronePoint = point([drone.lon, drone.lat]);

  let bestDistanceM = Infinity;
  let bestLon = coordinates[0]![0];
  let bestLat = coordinates[0]![1];
  let bestSegmentStart = 0;

  for (let index = 0; index < segmentCount; index += 1) {
    const start = coordinates[index]!;
    const end = coordinates[closed ? (index + 1) % vertexCount : index + 1]!;
    const [startLon, startLat] = start;
    const [endLon, endLat] = end;

    const closest = closestPointOnSegment(
      drone.lon,
      drone.lat,
      startLon,
      startLat,
      endLon,
      endLat,
    );

    const segmentDistanceM =
      distance(dronePoint, point([closest.lon, closest.lat]), {
        units: "kilometers",
      }) * 1000;

    if (segmentDistanceM < bestDistanceM) {
      bestDistanceM = segmentDistanceM;
      bestLon = closest.lon;
      bestLat = closest.lat;
      bestSegmentStart = index;
    }
  }

  const forwardIndex = closed
    ? (bestSegmentStart + 1) % vertexCount
    : bestSegmentStart + 1;

  return {
    lon: bestLon,
    lat: bestLat,
    distanceM: bestDistanceM,
    targetWaypointIndex: Math.min(forwardIndex, vertexCount - 1),
  };
}
