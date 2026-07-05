import bearing from "@turf/bearing";
import { point } from "@turf/helpers";
import type { PathGeoJson } from "@dominion-dynamics/shared";
import { PATROL_ASSET_ID } from "@dominion-dynamics/shared";
import {
  PATROL_DRONE_ALT_M,
  PATROL_DRONE_SPEED_MPS,
} from "./constants.js";
import type { PatrolDroneState } from "./types.js";

/** Turf bearing is -180..180; asset heading is 0..360 clockwise from north. */
function turfBearingToHeading(bearingDeg: number): number {
  return (bearingDeg + 360) % 360;
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

/** Build the initial patrol drone state at the first path vertex. */
export function createInitialPatrolDroneState(
  path: PathGeoJson,
  pathId: number | null = null,
): PatrolDroneState {
  const coordinates = path.geometry.coordinates;
  const [startLon, startLat] = coordinates[0]!;
  const [nextLon, nextLat] = coordinates[1]!;

  return {
    mode: "patrol",
    segmentIndex: 1,
    shadowTargetId: null,
    pathId,
    asset: {
      id: PATROL_ASSET_ID,
      lat: startLat,
      lon: startLon,
      alt: PATROL_DRONE_ALT_M,
      heading: headingToward(startLon, startLat, nextLon, nextLat),
      speed: PATROL_DRONE_SPEED_MPS,
      role: "patrol",
      category: 14,
      callsign: "PATROL1",
      originCountry: null,
      onGround: false,
      threat: "normal",
      tteSeconds: null,
      nearestZoneDistanceM: null,
    },
  };
}
