import pointToLineDistance from "@turf/point-to-line-distance";
import type { Feature, LineString, Point } from "geojson";

/**
 * Shortest distance in meters from an asset point to a zone outer-ring boundary.
 * The boundary LineString is precomputed when the zone is cached.
 */
export function distancePointToBoundaryM(
  assetPoint: Feature<Point>,
  boundary: Feature<LineString>,
): number {
  return (
    pointToLineDistance(assetPoint, boundary, {
      units: "kilometers",
    }) * 1000
  );
}
