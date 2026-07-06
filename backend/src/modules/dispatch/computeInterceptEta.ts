import type { Asset, DispatchPhase } from "@dominion-dynamics/shared";
import { distanceM } from "../../lib/geo/distanceAndHeading.js";
import { PATROL_MAX_INTERCEPT_MPS } from "../patrol/constants.js";

const ETA_PHASES = new Set<DispatchPhase>(["enroute", "intercepting"]);

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
    1,
    PATROL_MAX_INTERCEPT_MPS * 0.25,
  );

  return distanceToTargetM / closingSpeedMps;
}
