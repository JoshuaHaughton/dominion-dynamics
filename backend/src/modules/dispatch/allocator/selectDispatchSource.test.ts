import { describe, expect, it } from "vitest";
import { PATROL_ASSET_ID } from "@dominion-dynamics/shared";
import { TEST_IDS, UUID_PATTERN } from "@dominion-dynamics/shared/testing";
import { selectDispatchSource } from "./selectDispatchSource.js";
import type { DispatchDroneCandidate } from "../types.js";

describe("selectDispatchSource", () => {
  const IDLE_DISPATCH_ID = TEST_IDS.DISPATCH_DRONE;
  const target = { id: "critical-1", lat: 45.3225, lon: -75.6692 };

  it("spawns at the nearest airport when no drones exist", () => {
    const decision = selectDispatchSource({
      target,
      drones: [],
      reservedDroneIds: new Set(),
    });

    expect(decision).toMatchObject({
      type: "spawn",
      homeAirportIdent: "CYOW",
    });

    if (decision.type === "spawn") {
      expect(decision.droneId).toMatch(UUID_PATTERN);
    }
  });

  it("assigns idle patrol when it is closer than the nearest airport", () => {
    const drones: DispatchDroneCandidate[] = [
      {
        droneId: PATROL_ASSET_ID,
        lat: target.lat,
        lon: target.lon,
        origin: "patrol",
        patrol: { mode: "patrol" },
        availability: "available",
        missionTargetId: null,
      },
    ];

    const decision = selectDispatchSource({
      target,
      drones,
      reservedDroneIds: new Set(),
    });

    expect(decision).toEqual({ type: "patrol", droneId: PATROL_ASSET_ID });
  });

  it("spawns when the nearest airport is closer than idle patrol", () => {
    const drones: DispatchDroneCandidate[] = [
      {
        droneId: PATROL_ASSET_ID,
        lat: 10,
        lon: 10,
        origin: "patrol",
        patrol: { mode: "patrol" },
        availability: "available",
        missionTargetId: null,
      },
    ];

    const decision = selectDispatchSource({
      target,
      drones,
      reservedDroneIds: new Set(),
    });

    expect(decision.type).toBe("spawn");
  });

  it("reuses a nearby dispatch drone when it is closer than spawning at the airport", () => {
    const drones: DispatchDroneCandidate[] = [
      {
        droneId: IDLE_DISPATCH_ID,
        lat: target.lat,
        lon: target.lon,
        origin: "dispatch",
        availability: "available",
        missionTargetId: null,
        homeAirportIdent: "CYOW",
      },
    ];

    const decision = selectDispatchSource({
      target,
      drones,
      reservedDroneIds: new Set(),
    });

    expect(decision).toEqual({
      type: "reuse",
      droneId: IDLE_DISPATCH_ID,
      homeAirportIdent: "CYOW",
    });
  });

  it("assigns idle patrol when it is closer than a distant reusable dispatch drone", () => {
    const drones: DispatchDroneCandidate[] = [
      {
        droneId: PATROL_ASSET_ID,
        lat: target.lat,
        lon: target.lon,
        origin: "patrol",
        patrol: { mode: "patrol" },
        availability: "available",
        missionTargetId: null,
      },
      {
        droneId: IDLE_DISPATCH_ID,
        lat: 10,
        lon: 10,
        origin: "dispatch",
        availability: "available",
        missionTargetId: null,
        homeAirportIdent: "CYOW",
      },
    ];

    const decision = selectDispatchSource({
      target,
      drones,
      reservedDroneIds: new Set(),
    });

    expect(decision).toEqual({ type: "patrol", droneId: PATROL_ASSET_ID });
  });

  it("does not assign busy patrol drones", () => {
    const drones: DispatchDroneCandidate[] = [
      {
        droneId: PATROL_ASSET_ID,
        lat: 45.35,
        lon: -75.66,
        origin: "patrol",
        patrol: { mode: "shadow" },
        availability: "busy",
        missionTargetId: "other-target",
      },
    ];

    const decision = selectDispatchSource({
      target,
      drones,
      reservedDroneIds: new Set(),
    });

    expect(decision.type).toBe("spawn");
  });

  it("skips drones already reserved for another assignment", () => {
    const drones: DispatchDroneCandidate[] = [
      {
        droneId: IDLE_DISPATCH_ID,
        lat: 45.33,
        lon: -75.67,
        origin: "dispatch",
        availability: "available",
        missionTargetId: null,
      },
    ];

    const decision = selectDispatchSource({
      target,
      drones,
      reservedDroneIds: new Set([IDLE_DISPATCH_ID]),
    });

    expect(decision.type).toBe("spawn");

    if (decision.type === "spawn") {
      expect(decision.droneId).toMatch(UUID_PATTERN);
      expect(decision.droneId).not.toBe(IDLE_DISPATCH_ID);
    }
  });

  it.each([{ mode: "shadow" as const }, { mode: "rejoin" as const }])(
    "never diverts a $mode patrol even when it is the closest drone",
    ({ mode }) => {
      const drones: DispatchDroneCandidate[] = [
        {
          droneId: PATROL_ASSET_ID,
          lat: target.lat,
          lon: target.lon,
          origin: "patrol",
          patrol: { mode },
          availability: "available",
          missionTargetId: null,
        },
      ];

      const decision = selectDispatchSource({
        target,
        drones,
        reservedDroneIds: new Set(),
      });

      expect(decision.type).toBe("spawn");
    },
  );
});
