import destination from "@turf/destination";
import { point } from "@turf/helpers";
import type { Asset } from "@dominion-dynamics/shared";
import { distanceM, headingToward } from "../../lib/geo/distanceAndHeading.js";
import { clamp, lerp } from "../../lib/math/interpolate.js";
import {
  PATROL_DRONE_ALT_M,
  PATROL_MAX_INTERCEPT_MPS,
  PATROL_VERTICAL_RATE_MPS,
  SHADOW_APPROACH_EASE_M,
  SHADOW_LEAD_LAG_THRESHOLD_M,
  SHADOW_TAIL_ANGLE_DEG,
  SHADOW_TRAIL_ARRIVAL_M,
  SHADOW_TRAIL_OFFSET_M,
} from "./constants.js";

/** Leave headroom so one tick's step lands short of the remaining distance. */
const CHASE_MAX_STEP_DISTANCE_FRACTION = 0.9;

/** Target velocity within this angle of the drone bearing counts as head-on closure. */
const HEAD_ON_CLOSURE_ANGLE_DEG = 90;

/** Fraction of the target distance used as lateral stand-off on head-on merges. */
const LATERAL_STANDOFF_FACTOR = 0.5;

/** Brake early on head-on closure within this range of the target. */
const HEAD_ON_DECEL_RANGE_M = SHADOW_TRAIL_OFFSET_M * 2;

function angleDiffDegrees(a: number, b: number): number {
  const diff = Math.abs(a - b) % 360;

  return diff > 180 ? 360 - diff : diff;
}

/** Cap speed so one tick cannot overshoot a remaining distance. */
export function capSpeedForRemainingDistance(
  speed: number,
  distanceM: number,
  deltaSeconds: number,
  minSpeed = 0,
): number {
  if (deltaSeconds <= 0) {
    return speed;
  }

  const maxForStep =
    (distanceM / deltaSeconds) * CHASE_MAX_STEP_DISTANCE_FRACTION;

  return Math.min(speed, Math.max(minSpeed, maxForStep));
}

/**
 * True when the target's velocity vector points toward the drone.
 * Used to avoid trail pursuit on head-on intercepts, where the trail slot
 * sits between the drone and the target and would steer them into each other.
 */
export function isTargetClosingOnDrone(
  drone: Pick<Asset, "lat" | "lon">,
  target: Pick<Asset, "lat" | "lon" | "heading">,
): boolean {
  const bearingTargetToDrone = headingToward(
    target.lon,
    target.lat,
    drone.lon,
    drone.lat,
  );

  return (
    angleDiffDegrees(bearingTargetToDrone, target.heading) <=
    HEAD_ON_CLOSURE_ANGLE_DEG
  );
}

/** Patrol drone is in the target's wake, not off to the side or in front. */
export function isTrailingTarget(
  drone: Pick<Asset, "lat" | "lon">,
  target: Pick<Asset, "lat" | "lon" | "heading">,
): boolean {
  const bearingFromTargetToDrone = headingToward(
    target.lon,
    target.lat,
    drone.lon,
    drone.lat,
  );
  const tailHeading = (target.heading + 180) % 360;

  return (
    angleDiffDegrees(bearingFromTargetToDrone, tailHeading) <=
    SHADOW_TAIL_ANGLE_DEG
  );
}

/**
 * Slot behind the target along its heading — the drone steers here once close
 * so it can shadow without overlapping the target center.
 */
export function trailPointBehindTarget(
  target: Pick<Asset, "lat" | "lon" | "heading">,
  offsetM = SHADOW_TRAIL_OFFSET_M,
): { lon: number; lat: number } {
  const trail = destination(
    point([target.lon, target.lat]),
    offsetM / 1000,
    (target.heading + 180) % 360,
    { units: "kilometers" },
  );
  const [lon = target.lon, lat = target.lat] = trail.geometry.coordinates;

  return { lon, lat };
}

/** Offset beside the target on the drone side — avoids steering through a head-on merge. */
function lateralMergePointWhenClosing(
  drone: Pick<Asset, "lat" | "lon">,
  target: Pick<Asset, "lat" | "lon" | "heading">,
): { lon: number; lat: number } {
  const distanceToTargetM = distanceM(
    drone.lon,
    drone.lat,
    target.lon,
    target.lat,
  );
  const bearingToDrone = headingToward(
    target.lon,
    target.lat,
    drone.lon,
    drone.lat,
  );
  const rightHeading = (target.heading + 90) % 360;
  const leftHeading = (target.heading + 270) % 360;
  const useRight =
    angleDiffDegrees(bearingToDrone, rightHeading) <
    angleDiffDegrees(bearingToDrone, leftHeading);
  const lateralHeading = useRight ? rightHeading : leftHeading;
  const standOffM = clamp(
    distanceToTargetM * LATERAL_STANDOFF_FACTOR,
    SHADOW_TRAIL_ARRIVAL_M,
    SHADOW_TRAIL_OFFSET_M,
  );
  const merge = destination(
    point([target.lon, target.lat]),
    standOffM / 1000,
    lateralHeading,
    { units: "kilometers" },
  );
  const [lon = target.lon, lat = target.lat] = merge.geometry.coordinates;

  return { lon, lat };
}

/** Steer at the target when far; lag trail slot when close; lateral merge when head-on. */
export function resolveChaseSteerPoint(
  drone: Pick<Asset, "lat" | "lon">,
  target: Pick<Asset, "lat" | "lon" | "heading" | "speed">,
): { lon: number; lat: number } {
  const distanceToTargetM = distanceM(
    drone.lon,
    drone.lat,
    target.lon,
    target.lat,
  );
  const closing = isTargetClosingOnDrone(drone, target);
  const trailing = isTrailingTarget(drone, target);

  if (closing && !trailing) {
    return lateralMergePointWhenClosing(drone, target);
  }

  if (distanceToTargetM > SHADOW_LEAD_LAG_THRESHOLD_M) {
    return { lon: target.lon, lat: target.lat };
  }

  return trailPointBehindTarget(target);
}

function resolveChaseAltitude(
  currentAlt: number,
  desiredAlt: number,
  deltaSeconds: number,
): number {
  const maxStep = PATROL_VERTICAL_RATE_MPS * deltaSeconds;

  return currentAlt + clamp(desiredAlt - currentAlt, -maxStep, maxStep);
}

/**
 * Max intercept speed until trailing; ease toward target speed over the full
 * trail offset so the drone does not blow past the slot. Brake on head-on closure.
 */
export function resolveChaseSpeed(
  drone: Pick<Asset, "lat" | "lon" | "alt">,
  target: Pick<Asset, "lat" | "lon" | "heading" | "speed" | "alt">,
  steerPoint: Pick<Asset, "lon" | "lat">,
  deltaSeconds: number,
): Pick<Asset, "speed" | "alt"> {
  const distanceToTargetM = distanceM(
    drone.lon,
    drone.lat,
    target.lon,
    target.lat,
  );
  const distanceToSteerM = distanceM(
    drone.lon,
    drone.lat,
    steerPoint.lon,
    steerPoint.lat,
  );
  const trailing = isTrailingTarget(drone, target);
  const closing = isTargetClosingOnDrone(drone, target);
  let speed = PATROL_MAX_INTERCEPT_MPS;

  if (trailing) {
    if (distanceToSteerM <= SHADOW_TRAIL_ARRIVAL_M) {
      speed = target.speed;
    } else {
      const range = SHADOW_TRAIL_OFFSET_M - SHADOW_TRAIL_ARRIVAL_M;
      const blend = 1 - (distanceToSteerM - SHADOW_TRAIL_ARRIVAL_M) / range;
      speed = lerp(PATROL_MAX_INTERCEPT_MPS, target.speed, clamp(blend, 0, 1));
    }
  } else if (closing && distanceToTargetM <= HEAD_ON_DECEL_RANGE_M) {
    speed = Math.max(
      target.speed,
      lerp(
        target.speed,
        PATROL_MAX_INTERCEPT_MPS,
        distanceToTargetM / HEAD_ON_DECEL_RANGE_M,
      ),
    );
  }

  speed = capSpeedForRemainingDistance(
    speed,
    distanceToSteerM,
    deltaSeconds,
    target.speed,
  );

  const desiredAlt =
    trailing && distanceToSteerM <= SHADOW_APPROACH_EASE_M
      ? target.alt
      : PATROL_DRONE_ALT_M;

  return {
    speed,
    alt: resolveChaseAltitude(drone.alt, desiredAlt, deltaSeconds),
  };
}
