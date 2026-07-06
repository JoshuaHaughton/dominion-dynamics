import type { Asset } from "@dominion-dynamics/shared";
import { stepAsset } from "../../sim/tick/movement.js";
import { distanceM, headingToward } from "../../../lib/geo/distanceAndHeading.js";
import { resolveChaseSpeed, resolveChaseSteerPoint } from "../shadow/shadowChase.js";

/** Move one tick toward a fixed lon/lat with heading set from the drone position. */
export function stepDroneTowardPoint(
  asset: Asset,
  targetLon: number,
  targetLat: number,
  deltaSeconds: number,
): Asset {
  const distanceToTargetM = distanceM(
    asset.lon,
    asset.lat,
    targetLon,
    targetLat,
  );

  if (distanceToTargetM <= 0.5) {
    return { ...asset, speed: 0 };
  }

  const heading = headingToward(asset.lon, asset.lat, targetLon, targetLat);

  return stepAsset({
    asset: { ...asset, heading },
    deltaSeconds,
  });
}

/** One shadow-style chase tick toward a traffic target (lead / merge / trail steering). */
export function advanceChaseTowardTarget(
  drone: Asset,
  target: Asset,
  deltaSeconds: number,
): Asset {
  const steerPoint = resolveChaseSteerPoint(drone, target);
  const chaseSpeed = resolveChaseSpeed(drone, target, steerPoint, deltaSeconds);
  const chasing = {
    ...drone,
    ...chaseSpeed,
  };

  return stepDroneTowardPoint(
    chasing,
    steerPoint.lon,
    steerPoint.lat,
    deltaSeconds,
  );
}
