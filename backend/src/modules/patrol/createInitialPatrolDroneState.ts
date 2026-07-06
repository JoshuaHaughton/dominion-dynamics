import type { PathGeoJson } from "@dominion-dynamics/shared";
import { PATROL_ASSET_ID } from "@dominion-dynamics/shared";
import { headingToward } from "../../lib/geo/distanceAndHeading.js";
import {
  PATROL_DRONE_ALT_M,
  PATROL_DRONE_SPEED_MPS,
} from "./constants.js";
import type { PatrolDroneState } from "./types.js";

/** Build the initial patrol drone state at the first path vertex. */
export function createInitialPatrolDroneState(
  path: PathGeoJson,
  pathId: number | null = null,
): PatrolDroneState {
  const coordinates = path.geometry.coordinates;
  const [startLon, startLat] = coordinates[0]!;
  const [nextLon, nextLat] = coordinates[Math.min(1, coordinates.length - 1)]!;

  return {
    mode: "patrol",
    targetWaypointIndex: Math.min(1, coordinates.length - 1),
    pathDirection: "forward",
    shadowTargetId: null,
    pathId,
    rejoinTarget: null,
    asset: {
      id: PATROL_ASSET_ID,
      lat: startLat,
      lon: startLon,
      alt: PATROL_DRONE_ALT_M,
      heading: headingToward(startLon, startLat, nextLon, nextLat),
      speed: PATROL_DRONE_SPEED_MPS,
      role: "drone",
      category: 14,
      callsign: "PATROL1",
      originCountry: null,
      onGround: false,
      zone: null,
    },
  };
}
