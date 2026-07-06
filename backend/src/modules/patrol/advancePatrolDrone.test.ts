import { beforeEach, describe, expect, it } from "vitest";
import type { Asset, PathGeoJson } from "@dominion-dynamics/shared";
import { PATROL_ASSET_ID } from "@dominion-dynamics/shared";
import { testAsset } from "../../testFixtures/asset.js";
import {
  advancePatrolDrone,
  findNearestCriticalAsset,
  resolveShadowTarget,
} from "./advancePatrolDrone.js";
import { createInitialPatrolDroneState } from "./createInitialPatrolDroneState.js";
import {
  clearShadowAssignments,
  getShadowDroneId,
  setShadowAssignment,
} from "./shadowAssignmentStore.js";
import { PATROL_MAX_INTERCEPT_MPS, PATROL_VERTICAL_RATE_MPS } from "./constants.js";
import { trailPointBehindTarget } from "./shadowChase.js";

describe("advancePatrolDrone", () => {
  const patrolPath: PathGeoJson = {
    type: "Feature",
    properties: {},
    geometry: {
      type: "LineString",
      coordinates: [
        [-75.8, 45.3],
        [-75.7, 45.35],
        [-75.6, 45.4],
      ],
    },
  };

  beforeEach(() => {
    clearShadowAssignments();
  });

  it("creates the patrol drone at the first waypoint facing the second", () => {
    const state = createInitialPatrolDroneState(patrolPath, 1);

    expect(state.asset.id).toBe(PATROL_ASSET_ID);
    expect(state.asset.role).toBe("drone");
    expect(state.asset.lat).toBe(45.3);
    expect(state.asset.lon).toBe(-75.8);
    expect(state.mode).toBe("patrol");
    expect(state.targetWaypointIndex).toBe(1);
    expect(state.pathId).toBe(1);
    expect(state.asset.heading).toBeGreaterThan(0);
  });

  it("moves along the patrol path when no critical assets exist", () => {
    const initial = createInitialPatrolDroneState(patrolPath);
    const next = advancePatrolDrone({
      state: initial,
      path: patrolPath,
      liveAssets: [],
      deltaSeconds: 1,
    });

    expect(next.mode).toBe("patrol");
    expect(next.shadowTargetId).toBeNull();
    expect(next.asset.lat).not.toBe(initial.asset.lat);
    expect(next.asset.lon).not.toBe(initial.asset.lon);
  });

  it("enters shadow mode and chases the nearest critical asset", () => {
    const initial = createInitialPatrolDroneState(patrolPath);

    const nearCritical: Asset = testAsset({
      id: "critical-near",
      lat: initial.asset.lat + 0.01,
      lon: initial.asset.lon + 0.01,
      alt: 1000,
      heading: 90,
      speed: 200,
      zone: { threat: "critical", zoneTteSeconds: 0, nearestBoundaryM: 0 },
    });

    const farCritical: Asset = testAsset({
      id: "critical-far",
      lat: initial.asset.lat + 0.2,
      lon: initial.asset.lon + 0.2,
      alt: 1000,
      heading: 90,
      speed: 200,
      zone: { threat: "critical", zoneTteSeconds: 0, nearestBoundaryM: 0 },
    });

    const shadowing = advancePatrolDrone({
      state: initial,
      path: patrolPath,
      liveAssets: [farCritical, nearCritical],
      deltaSeconds: 1,
    });

    expect(shadowing.mode).toBe("shadow");
    expect(shadowing.shadowTargetId).toBe("critical-near");
    expect(getShadowDroneId("critical-near")).toBe(PATROL_ASSET_ID);
    expect(findNearestCriticalAsset(initial.asset, [farCritical, nearCritical])?.id).toBe(
      "critical-near",
    );
  });

  it("keeps the current shadow target when still critical", () => {
    const initial = createInitialPatrolDroneState(patrolPath);
    initial.mode = "shadow";
    initial.shadowTargetId = "critical-far";
    setShadowAssignment("critical-far", PATROL_ASSET_ID);

    const nearCritical: Asset = testAsset({
      id: "critical-near",
      lat: initial.asset.lat + 0.001,
      lon: initial.asset.lon + 0.001,
      alt: 1000,
      heading: 90,
      speed: 200,
      zone: { threat: "critical", zoneTteSeconds: 0, nearestBoundaryM: 0 },
    });

    const farCritical: Asset = testAsset({
      id: "critical-far",
      lat: initial.asset.lat + 0.2,
      lon: initial.asset.lon + 0.2,
      alt: 1000,
      heading: 90,
      speed: 200,
      zone: { threat: "critical", zoneTteSeconds: 0, nearestBoundaryM: 0 },
    });

    expect(
      resolveShadowTarget(initial, [nearCritical, farCritical])?.id,
    ).toBe("critical-far");
  });

  it("does not steal a target assigned to another drone", () => {
    const initial = createInitialPatrolDroneState(patrolPath);
    setShadowAssignment("critical-taken", "other-drone");

    const takenCritical: Asset = testAsset({
      id: "critical-taken",
      lat: initial.asset.lat + 0.001,
      lon: initial.asset.lon + 0.001,
      alt: 1000,
      heading: 90,
      speed: 200,
      zone: { threat: "critical", zoneTteSeconds: 0, nearestBoundaryM: 0 },
    });

    expect(resolveShadowTarget(initial, [takenCritical])).toBeNull();
  });

  it("intercepts at max speed when the target is slow and far away", () => {
    const initial = createInitialPatrolDroneState(patrolPath);
    const critical: Asset = testAsset({
      id: "critical-slow",
      lat: initial.asset.lat + 0.05,
      lon: initial.asset.lon + 0.05,
      alt: 3500,
      heading: 90,
      speed: 25,
      zone: { threat: "critical", zoneTteSeconds: 0, nearestBoundaryM: 0 },
    });

    const shadowing = advancePatrolDrone({
      state: initial,
      path: patrolPath,
      liveAssets: [critical],
      deltaSeconds: 1,
    });

    expect(shadowing.asset.speed).toBe(PATROL_MAX_INTERCEPT_MPS);
    expect(shadowing.asset.alt).toBe(500);
  });

  it("intercepts at max speed when the target is faster than cruise", () => {
    const initial = createInitialPatrolDroneState(patrolPath);
    const critical: Asset = testAsset({
      id: "critical-fast",
      lat: initial.asset.lat + 0.05,
      lon: initial.asset.lon + 0.05,
      alt: 10000,
      heading: 90,
      speed: 200,
      zone: { threat: "critical", zoneTteSeconds: 0, nearestBoundaryM: 0 },
    });

    const shadowing = advancePatrolDrone({
      state: initial,
      path: patrolPath,
      liveAssets: [critical],
      deltaSeconds: 1,
    });

    expect(shadowing.asset.speed).toBe(PATROL_MAX_INTERCEPT_MPS);
  });

  it("matches target speed when trailing at the trail slot", () => {
    const initial = createInitialPatrolDroneState(patrolPath);
    const critical: Asset = testAsset({
      id: "critical-trail",
      lat: 45.3,
      lon: -75.7,
      alt: 3500,
      heading: 0,
      speed: 25,
      zone: { threat: "critical", zoneTteSeconds: 0, nearestBoundaryM: 0 },
    });
    const trail = trailPointBehindTarget(critical);

    initial.asset.lat = trail.lat + 0.0001;
    initial.asset.lon = trail.lon;

    const shadowing = advancePatrolDrone({
      state: initial,
      path: patrolPath,
      liveAssets: [critical],
      deltaSeconds: 1,
    });

    expect(shadowing.asset.speed).toBe(25);
    expect(shadowing.asset.alt).toBe(500 + PATROL_VERTICAL_RATE_MPS);
  });

  it("rejoins toward the route when shadow ends off the route", () => {
    const initial = createInitialPatrolDroneState(patrolPath);
    const critical: Asset = testAsset({
      id: "critical-1",
      lat: initial.asset.lat + 0.01,
      lon: initial.asset.lon + 0.01,
      alt: 1000,
      heading: 90,
      speed: 200,
      zone: { threat: "critical", zoneTteSeconds: 0, nearestBoundaryM: 0 },
    });

    const shadowing = advancePatrolDrone({
      state: initial,
      path: patrolPath,
      liveAssets: [critical],
      deltaSeconds: 1,
    });

    expect(shadowing.mode).toBe("shadow");

    const resumed = advancePatrolDrone({
      state: shadowing,
      path: patrolPath,
      liveAssets: [],
      deltaSeconds: 1,
    });

    expect(resumed.shadowTargetId).toBeNull();
    expect(getShadowDroneId("critical-1")).toBeUndefined();
    expect(["patrol", "rejoin"]).toContain(resumed.mode);
    expect(resumed.asset.speed).toBeLessThanOrEqual(PATROL_MAX_INTERCEPT_MPS);
    expect(resumed.asset.speed).toBeGreaterThan(0);
    expect(resumed.asset.alt).toBe(500);
  });

  it("ignores other patrol assets when selecting a shadow target", () => {
    const initial = createInitialPatrolDroneState(patrolPath);
    const otherPatrol: Asset = {
      ...initial.asset,
      id: "patrol-2",
      lat: initial.asset.lat + 0.001,
      lon: initial.asset.lon + 0.001,
      zone: { threat: "critical", zoneTteSeconds: 0, nearestBoundaryM: 0 },
    };

    expect(findNearestCriticalAsset(initial.asset, [otherPatrol])).toBeNull();
  });
});
