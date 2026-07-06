import type { PathGeoJson } from "@dominion-dynamics/shared";
import { PATROL_ASSET_ID, PATROL_CALLSIGN } from "@dominion-dynamics/shared";
import { headingToward } from "../../../lib/geo/distanceAndHeading.js";
import { lonLatFromPosition } from "../../../lib/geo/position.js";
import { buildDroneAsset } from "../../drones/buildDroneAsset.js";
import { PATROL_DRONE_SPEED_MPS } from "../constants.js";
import type { PatrolDroneState } from "../types.js";

/** Build the initial patrol drone state at the first path vertex. */
export function createInitialPatrolDroneState(
  path: PathGeoJson,
  pathId: number | null = null,
): PatrolDroneState {
  const coordinates = path.geometry.coordinates;
  // Schema guarantees ≥2 vertices at the API boundary, but repo data flows here too.
  const start = lonLatFromPosition(coordinates[0]);
  const next = lonLatFromPosition(
    coordinates[Math.min(1, coordinates.length - 1)],
  );

  if (!start || !next) {
    throw new Error("Patrol path needs at least one vertex");
  }

  const { lon: startLon, lat: startLat } = start;
  const { lon: nextLon, lat: nextLat } = next;

  return {
    mode: "patrol",
    targetWaypointIndex: Math.min(1, coordinates.length - 1),
    pathDirection: "forward",
    shadowTargetId: null,
    pathId,
    rejoinTarget: null,
    asset: buildDroneAsset({
      id: PATROL_ASSET_ID,
      callsign: PATROL_CALLSIGN,
      lat: startLat,
      lon: startLon,
      heading: headingToward(startLon, startLat, nextLon, nextLat),
      speed: PATROL_DRONE_SPEED_MPS,
    }),
  };
}
