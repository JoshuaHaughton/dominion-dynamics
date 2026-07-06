import bearing from "@turf/bearing";
import distance from "@turf/distance";
import { point } from "@turf/helpers";

/** Turf bearing is -180..180; asset heading is 0..360 clockwise from north. */
export function turfBearingToHeading(bearingDeg: number): number {
  return (bearingDeg + 360) % 360;
}

/** Haversine distance in meters between two WGS84 points (via Turf). */
export function distanceM(
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

/** Compass heading (0..360 clockwise from north) from one WGS84 point toward another. */
export function headingToward(
  fromLon: number,
  fromLat: number,
  toLon: number,
  toLat: number,
): number {
  return turfBearingToHeading(
    bearing(point([fromLon, fromLat]), point([toLon, toLat])),
  );
}
