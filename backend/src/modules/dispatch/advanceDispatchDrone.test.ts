import { beforeEach, describe, expect, it } from "vitest";
import destination from "@turf/destination";
import { point } from "@turf/helpers";
import type { Asset } from "@dominion-dynamics/shared";
import { PATROL_ASSET_ID } from "@dominion-dynamics/shared";
import { distanceM } from "../../lib/geo/distanceAndHeading.js";
import { testAsset } from "../../testFixtures/asset.js";
import {
  advanceDispatchDrone,
  resolveDispatchChasePhase,
} from "./advanceDispatchDrone.js";
import { clearDispatchDroneStates } from "./dispatchDroneStore.js";
import { createSpawnedDispatchDrone } from "./createDispatchDrone.js";
import type { DispatchMission } from "./types.js";
import { getAirportByIdent } from "../airport/registry.js";
import { trailPointBehindTarget } from "../patrol/shadowChase.js";

const DISPATCH_DRONE_ID = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";

describe("advanceDispatchDrone", () => {
  const mission: DispatchMission = {
    targetId: "critical-1",
    droneId: DISPATCH_DRONE_ID,
    assignmentSource: "spawn",
    homeAirportIdent: "CYOW",
    assignedAtMs: Date.now(),
  };

  const cyow = getAirportByIdent("CYOW")!;

  beforeEach(() => {
    clearDispatchDroneStates();
  });

  it("chases a critical target while enroute", () => {
    const target = testAsset({
      id: "critical-1",
      lat: cyow.lat + 0.05,
      lon: cyow.lon + 0.05,
      alt: 1000,
      heading: 90,
      speed: 200,
      zone: { threat: "critical", zoneTteSeconds: 0, nearestBoundaryM: 0 },
    });

    const initial = createSpawnedDispatchDrone(
      mission,
      cyow.lat,
      cyow.lon,
      target.lat,
      target.lon,
    );

    const result = advanceDispatchDrone({
      state: initial,
      liveAssets: [target],
      deltaSeconds: 1,
    });

    expect(result.kind).toBe("continue");

    if (result.kind !== "continue") {
      return;
    }

    expect(result.state.phase).toBe("enroute");
    expect(result.state.asset.lat).not.toBe(initial.asset.lat);
  });

  it("enters rtb when the assigned target is no longer critical", () => {
    const target = testAsset({
      id: "critical-1",
      lat: cyow.lat + 0.1,
      lon: cyow.lon + 0.1,
      alt: 1000,
      heading: 90,
      speed: 200,
      zone: { threat: "critical", zoneTteSeconds: 0, nearestBoundaryM: 0 },
    });

    const initial = createSpawnedDispatchDrone(
      mission,
      cyow.lat,
      cyow.lon,
      target.lat,
      target.lon,
    );

    const chasing = advanceDispatchDrone({
      state: initial,
      liveAssets: [target],
      deltaSeconds: 30,
    });

    expect(chasing.kind).toBe("continue");

    if (chasing.kind !== "continue") {
      return;
    }

    const clearedTarget = testAsset({
      ...target,
      zone: { threat: "normal", zoneTteSeconds: null, nearestBoundaryM: 100 },
    });

    const result = advanceDispatchDrone({
      state: chasing.state,
      liveAssets: [clearedTarget],
      deltaSeconds: 1,
    });

    expect(result.kind).toBe("continue");

    if (result.kind !== "continue") {
      return;
    }

    expect(result.state.phase).toBe("rtb");
    expect(result.state.targetId).toBeNull();
  });

  it("despawns dispatch drones that arrive at their home airport", () => {
    const initial = createSpawnedDispatchDrone(
      mission,
      cyow.lat,
      cyow.lon,
      cyow.lat + 0.1,
      cyow.lon + 0.1,
    );

    const result = advanceDispatchDrone({
      state: {
        ...initial,
        phase: "rtb",
        targetId: null,
      },
      liveAssets: [],
      deltaSeconds: 1,
    });

    expect(result.kind).toBe("despawn");
  });

  it("despawns after RTB movement crosses the arrival threshold", () => {
    const spawnPoint = destination(
      point([cyow.lon, cyow.lat]),
      0.08,
      180,
      { units: "kilometers" },
    );
    const [spawnLon, spawnLat] = spawnPoint.geometry.coordinates;

    expect(
      distanceM(spawnLon, spawnLat, cyow.lon, cyow.lat),
    ).toBeGreaterThan(75);

    let state = createSpawnedDispatchDrone(
      mission,
      spawnLat,
      spawnLon,
      cyow.lat + 0.1,
      cyow.lon + 0.1,
    );

    state = {
      ...state,
      phase: "rtb",
      targetId: null,
    };

    for (let tick = 0; tick < 5; tick += 1) {
      const result = advanceDispatchDrone({
        state,
        liveAssets: [],
        deltaSeconds: 1,
      });

      if (result.kind === "despawn") {
        expect(tick).toBeLessThan(5);
        return;
      }

      expect(result.kind).toBe("continue");

      if (result.kind !== "continue") {
        return;
      }

      state = result.state;
    }

    throw new Error("expected RTB despawn near the arrival radius");
  });

  it("despawns during a full RTB without stalling near the arrival radius", () => {
    const initial = createSpawnedDispatchDrone(
      mission,
      cyow.lat + 0.02,
      cyow.lon,
      cyow.lat + 0.1,
      cyow.lon + 0.1,
    );

    let state: typeof initial = {
      ...initial,
      phase: "rtb",
      targetId: null,
    };

    for (let tick = 0; tick < 300; tick += 1) {
      const result = advanceDispatchDrone({
        state,
        liveAssets: [],
        deltaSeconds: 1,
      });

      if (result.kind === "despawn") {
        expect(tick).toBeLessThan(300);
        return;
      }

      expect(result.kind).toBe("continue");

      if (result.kind !== "continue") {
        return;
      }

      state = result.state;
    }

    throw new Error("dispatch drone never despawned during RTB");
  });

  it("hands patrol-born assignments back to the patrol layer on rtb", () => {
    const patrolMission: DispatchMission = {
      ...mission,
      droneId: PATROL_ASSET_ID,
      assignmentSource: "patrol",
      homeAirportIdent: null,
    };

    const initial = createSpawnedDispatchDrone(
      patrolMission,
      cyow.lat,
      cyow.lon,
      cyow.lat + 0.05,
      cyow.lon + 0.05,
    );

    const result = advanceDispatchDrone({
      state: {
        ...initial,
        origin: "patrol",
        assignmentSource: "patrol",
        phase: "rtb",
        targetId: null,
      },
      liveAssets: [],
      deltaSeconds: 1,
    });

    expect(result.kind).toBe("release_to_patrol");
  });

  it("classifies trailing when the drone sits in the target wake", () => {
    const target = testAsset({
      id: "critical-1",
      lat: 45.4,
      lon: -75.7,
      alt: 1000,
      heading: 0,
      speed: 200,
      zone: { threat: "critical", zoneTteSeconds: 0, nearestBoundaryM: 0 },
    });
    const trail = trailPointBehindTarget(target);
    const drone: Asset = {
      id: DISPATCH_DRONE_ID,
      lat: trail.lat,
      lon: trail.lon,
      alt: 500,
      heading: 0,
      speed: 200,
      role: "drone",
      category: 14,
      callsign: "Dispatch-1",
      originCountry: null,
      onGround: false,
      zone: null,
    };

    expect(resolveDispatchChasePhase(drone, target)).toBe("trailing");
  });

  it("classifies intercepting inside the lead/lag threshold", () => {
    const target = testAsset({
      id: "critical-1",
      lat: 45.4,
      lon: -75.7,
      alt: 1000,
      heading: 90,
      speed: 200,
      zone: { threat: "critical", zoneTteSeconds: 0, nearestBoundaryM: 0 },
    });
    const drone: Asset = {
      ...target,
      id: DISPATCH_DRONE_ID,
      role: "drone",
      zone: null,
      lat: target.lat + 0.001,
      lon: target.lon + 0.001,
    };

    expect(resolveDispatchChasePhase(drone, target)).toBe("intercepting");
  });
});
