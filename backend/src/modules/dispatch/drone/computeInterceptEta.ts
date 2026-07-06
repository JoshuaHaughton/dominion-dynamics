import type { Asset, DispatchPhase } from "@dominion-dynamics/shared";
import { distanceM } from "../../../lib/geo/distanceAndHeading.js";
import { PATROL_MAX_INTERCEPT_MPS } from "../../patrol/constants.js";

const ETA_PHASES = new Set<DispatchPhase>(["enroute", "intercepting"]);

/** ETA floor assumptions so a momentarily stopped drone never reports an infinite ETA. */
const MIN_ETA_CLOSING_SPEED_FRACTION = 0.25;
const MIN_ETA_CLOSING_SPEED_MPS = 1;

/** Rough time-to-intercept from current position and closing speed. */
export function computeInterceptEtaSeconds(
  drone: Pick<Asset, "lat" | "lon" | "speed">,
  target: Pick<Asset, "lat" | "lon"> | null | undefined,
  phase: DispatchPhase,
): number | null {
  if (target === null || target === undefined || !ETA_PHASES.has(phase)) {
    return null;
  }

  const distanceToTargetM = distanceM(
    drone.lon,
    drone.lat,
    target.lon,
    target.lat,
  );

  if (distanceToTargetM <= 0) {
    return 0;
  }

  const closingSpeedMps = Math.max(
    drone.speed,
    MIN_ETA_CLOSING_SPEED_MPS,
    PATROL_MAX_INTERCEPT_MPS * MIN_ETA_CLOSING_SPEED_FRACTION,
  );

  return distanceToTargetM / closingSpeedMps;
}
