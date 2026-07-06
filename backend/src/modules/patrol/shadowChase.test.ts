import { describe, expect, it } from "vitest";
import {
  PATROL_DRONE_ALT_M,
  PATROL_MAX_INTERCEPT_MPS,
  PATROL_VERTICAL_RATE_MPS,
} from "./constants.js";
import {
  isTargetClosingOnDrone,
  isTrailingTarget,
  leadPointAheadOfTarget,
  resolveChaseSpeed,
  resolveChaseSteerPoint,
  trailPointBehindTarget,
} from "./shadowChase.js";

describe("shadowChase", () => {
  const target = {
    lat: 45.3,
    lon: -75.7,
    heading: 0,
    speed: 25,
    alt: 3500,
  };

  it("uses max intercept speed when far and not trailing", () => {
    const drone = { lat: 45.2, lon: -75.7, alt: PATROL_DRONE_ALT_M };
    const steerPoint = resolveChaseSteerPoint(drone, target);

    expect(resolveChaseSpeed(drone, target, steerPoint, 1)).toEqual({
      speed: PATROL_MAX_INTERCEPT_MPS,
      alt: PATROL_DRONE_ALT_M,
    });
  });

  it("caps speed when close but not trailing so it does not overshoot", () => {
    const drone = { lat: 45.301, lon: -75.7, alt: PATROL_DRONE_ALT_M };
    const steerPoint = trailPointBehindTarget(target);

    expect(isTrailingTarget(drone, target)).toBe(false);

    const { speed } = resolveChaseSpeed(drone, target, steerPoint, 1);

    expect(speed).toBeLessThan(PATROL_MAX_INTERCEPT_MPS);
    expect(speed).toBeGreaterThan(target.speed);
  });

  it("matches target speed when trailing and at the trail slot", () => {
    const steerPoint = trailPointBehindTarget(target);
    const drone = {
      lat: steerPoint.lat + 0.0001,
      lon: steerPoint.lon,
      alt: PATROL_DRONE_ALT_M,
    };

    expect(isTrailingTarget(drone, target)).toBe(true);
    expect(resolveChaseSpeed(drone, target, steerPoint, 1)).toEqual({
      speed: 25,
      alt: PATROL_DRONE_ALT_M + PATROL_VERTICAL_RATE_MPS,
    });
  });

  it("ramps altitude toward the target once trailing and near the trail slot", () => {
    const steerPoint = trailPointBehindTarget(target);
    const drone = {
      lat: steerPoint.lat + 0.0001,
      lon: steerPoint.lon,
      alt: PATROL_DRONE_ALT_M,
    };

    const next = resolveChaseSpeed(drone, target, steerPoint, 10);

    expect(next.alt).toBe(PATROL_DRONE_ALT_M + PATROL_VERTICAL_RATE_MPS * 10);
  });

  it("places the trail point behind the target heading", () => {
    const trail = trailPointBehindTarget(target);

    expect(trail.lat).toBeLessThan(target.lat);
    expect(trail.lon).toBeCloseTo(target.lon, 4);
  });

  it("steers toward the target when far away instead of leading ahead", () => {
    const drone = { lat: 45.2, lon: -75.7 };
    const steerPoint = resolveChaseSteerPoint(drone, target);

    expect(steerPoint.lat).toBeCloseTo(target.lat, 4);
    expect(steerPoint.lon).toBeCloseTo(target.lon, 4);
  });

  it("uses the trail slot when within the lead/lag threshold", () => {
    const drone = {
      lat: target.lat - 1_500 / 111_000,
      lon: target.lon,
    };
    const steerPoint = resolveChaseSteerPoint(drone, target);
    const trail = trailPointBehindTarget(target);

    expect(steerPoint.lat).toBeCloseTo(trail.lat, 4);
    expect(steerPoint.lon).toBeCloseTo(trail.lon, 4);
  });

  it("steers to a lateral merge point on head-on closure", () => {
    const closingTarget = { ...target, heading: 180 };
    const drone = { lat: target.lat - 0.01, lon: target.lon };

    expect(isTargetClosingOnDrone(drone, closingTarget)).toBe(true);

    const steerPoint = resolveChaseSteerPoint(drone, closingTarget);
    const trail = trailPointBehindTarget(closingTarget);

    expect(steerPoint.lat).not.toBeCloseTo(trail.lat, 3);
    expect(steerPoint.lon).not.toBeCloseTo(trail.lon, 3);
  });

  it("eases speed while trailing but still far from the trail slot", () => {
    const steerPoint = trailPointBehindTarget(target);
    const drone = {
      lat: steerPoint.lat + 0.002,
      lon: steerPoint.lon,
      alt: PATROL_DRONE_ALT_M,
    };

    expect(isTrailingTarget(drone, target)).toBe(true);

    const { speed } = resolveChaseSpeed(drone, target, steerPoint, 1);

    expect(speed).toBeGreaterThan(target.speed);
    expect(speed).toBeLessThan(PATROL_MAX_INTERCEPT_MPS);
  });
});
