import type { PathGeoJson } from "@dominion-dynamics/shared";
import { lonLatFromPosition } from "../../lib/geo/position.js";

/** Whether Terra Draw closed the route (duplicate first/last vertex). */
export function isClosedPatrolPath(path: PathGeoJson): boolean {
  const coordinates = path.geometry.coordinates;
  const start = lonLatFromPosition(coordinates[0]);
  const end = lonLatFromPosition(coordinates[coordinates.length - 1]);

  if (coordinates.length < 3 || !start || !end) {
    return false;
  }

  return start.lon === end.lon && start.lat === end.lat;
}

/** Number of line segments on the route (includes closing segment when closed). */
export function patrolPathSegmentCount(path: PathGeoJson): number {
  const vertexCount = path.geometry.coordinates.length;

  if (vertexCount < 2) {
    return 0;
  }

  return isClosedPatrolPath(path) ? vertexCount : vertexCount - 1;
}
