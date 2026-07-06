import type { PathGeoJson } from "@dominion-dynamics/shared";
import { headingToward } from "../../../lib/geo/distanceAndHeading.js";
import { lonLatFromPosition } from "../../../lib/geo/position.js";
import { beginRejoin } from "../path/rejoinToPath.js";
import type { PatrolDroneState } from "../types.js";

/**
 * Keep the drone at its current position when the route changes; snap patrol
 * state onto the new polyline instead of resetting to vertex zero.
 */
export function realignPatrolDroneToPath(
  state: PatrolDroneState,
  path: PathGeoJson,
  pathId: number | null,
): PatrolDroneState {
  const snapped = beginRejoin(state, path);
  // On-path resumes toward the projected waypoint; off-path flies to the snap point.
  const target =
    snapped.mode === "patrol"
      ? lonLatFromPosition(
          path.geometry.coordinates[snapped.targetWaypointIndex],
        )
      : snapped.rejoinTarget;

  const realigned = { ...snapped, pathId, pathDirection: "forward" as const };

  if (!target) {
    return realigned;
  }

  return {
    ...realigned,
    asset: {
      ...snapped.asset,
      heading: headingToward(
        snapped.asset.lon,
        snapped.asset.lat,
        target.lon,
        target.lat,
      ),
    },
  };
}
