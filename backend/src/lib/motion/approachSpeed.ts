import { clamp, lerp } from "../math/interpolate.js";

type ResolveApproachSpeedParams = {
  /** Remaining distance to the arrival point in meters. */
  distanceM: number;
  /** Arrival radius in meters. */
  arrivalM: number;
  /** Start braking inside this distance in meters. */
  decelM: number;
  deltaSeconds: number;
  /** Speed outside the deceleration band. */
  maxSpeed: number;
  /** Speed cap inside the arrival radius (besides closing the remaining gap this tick). */
  arrivalCapSpeed: number;
  /** Speed the decel band blends down to at the arrival edge. */
  bandFloorSpeed: number;
  /**
   * Keep at least enough speed inside the decel band to close the gap to the
   * arrival radius this tick — otherwise braking alone can leave the mover
   * crawling forever just outside it.
   */
  ensureGapClosure?: boolean;
};

/**
 * Ramp speed down near an arrival point (waypoint, rejoin snap, or airport).
 * At max speed one tick can travel farther than the arrival radius, so without
 * braking the mover overshoots and oscillates.
 */
export function resolveApproachSpeedMps({
  distanceM,
  arrivalM,
  decelM,
  deltaSeconds,
  maxSpeed,
  arrivalCapSpeed,
  bandFloorSpeed,
  ensureGapClosure = false,
}: ResolveApproachSpeedParams): number {
  if (distanceM <= arrivalM) {
    return Math.min(arrivalCapSpeed, distanceM / deltaSeconds);
  }

  if (distanceM >= decelM) {
    return maxSpeed;
  }

  const blend = (distanceM - arrivalM) / (decelM - arrivalM);
  const decelSpeed = lerp(bandFloorSpeed, maxSpeed, clamp(blend, 0, 1));

  const minSpeedToCloseGapMps = ensureGapClosure
    ? (distanceM - arrivalM) / deltaSeconds
    : 0;

  return Math.max(decelSpeed, minSpeedToCloseGapMps);
}
