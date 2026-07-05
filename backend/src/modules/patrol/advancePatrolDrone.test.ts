import { describe, expect, it } from "vitest";
import type { Asset, PathGeoJson } from "@dominion-dynamics/shared";
import { PATROL_ASSET_ID } from "@dominion-dynamics/shared";
import { testAsset } from "../../testFixtures/asset.js";
import {
  advancePatrolDrone,
  findNearestCriticalAsset,
} from "./advancePatrolDrone.js";
import { createInitialPatrolDroneState } from "./createInitialPatrolDroneState.js";

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

  it("creates the patrol drone at the first waypoint facing the second", () => {
    const state = createInitialPatrolDroneState(patrolPath, 1);

    expect(state.asset.id).toBe(PATROL_ASSET_ID);
    expect(state.asset.role).toBe("patrol");
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
      zone: { threat: "critical", tteSeconds: 0, nearestBoundaryM: 0 },
    });

    const farCritical: Asset = testAsset({
      id: "critical-far",
      lat: initial.asset.lat + 0.2,
      lon: initial.asset.lon + 0.2,
      alt: 1000,
      heading: 90,
      speed: 200,
      zone: { threat: "critical", tteSeconds: 0, nearestBoundaryM: 0 },
    });

    const shadowing = advancePatrolDrone({
      state: initial,
      path: patrolPath,
      liveAssets: [farCritical, nearCritical],
      deltaSeconds: 1,
    });

    expect(shadowing.mode).toBe("shadow");
    expect(shadowing.shadowTargetId).toBe("critical-near");
    expect(findNearestCriticalAsset(initial.asset, [farCritical, nearCritical])?.id).toBe(
      "critical-near",
    );
  });

  it("returns to patrol mode when critical assets clear", () => {
    const initial = createInitialPatrolDroneState(patrolPath);
    const critical: Asset = testAsset({
      id: "critical-1",
      lat: initial.asset.lat + 0.01,
      lon: initial.asset.lon + 0.01,
      alt: 1000,
      heading: 90,
      speed: 200,
      zone: { threat: "critical", tteSeconds: 0, nearestBoundaryM: 0 },
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
    expect(["patrol", "rejoin"]).toContain(resumed.mode);
  });

  it("ignores other patrol assets when selecting a shadow target", () => {
    const initial = createInitialPatrolDroneState(patrolPath);
    const otherPatrol: Asset = {
      ...initial.asset,
      id: "patrol-2",
      lat: initial.asset.lat + 0.001,
      lon: initial.asset.lon + 0.001,
      zone: { threat: "critical", tteSeconds: 0, nearestBoundaryM: 0 },
    };

    expect(findNearestCriticalAsset(initial.asset, [otherPatrol])).toBeNull();
  });
});
