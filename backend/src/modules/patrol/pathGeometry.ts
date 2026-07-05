import type { PathGeoJson } from "@dominion-dynamics/shared";

/** Whether Terra Draw closed the route (duplicate first/last vertex). */
export function isClosedPatrolPath(path: PathGeoJson): boolean {
  const coordinates = path.geometry.coordinates;

  if (coordinates.length < 3) {
    return false;
  }

  const [startLon, startLat] = coordinates[0]!;
  const [endLon, endLat] = coordinates[coordinates.length - 1]!;

  return startLon === endLon && startLat === endLat;
}

/** Number of line segments on the route (includes closing segment when closed). */
export function patrolPathSegmentCount(path: PathGeoJson): number {
  const vertexCount = path.geometry.coordinates.length;

  if (vertexCount < 2) {
    return 0;
  }

  return isClosedPatrolPath(path) ? vertexCount : vertexCount - 1;
}
