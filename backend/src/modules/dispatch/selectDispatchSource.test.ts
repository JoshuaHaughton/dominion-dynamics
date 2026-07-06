import { describe, expect, it } from "vitest";
import { PATROL_ASSET_ID } from "@dominion-dynamics/shared";
import { selectDispatchSource } from "./selectDispatchSource.js";
import type { DispatchDroneCandidate } from "./types.js";

describe("selectDispatchSource", () => {
  const target = { id: "critical-1", lat: 45.3225, lon: -75.6692 };

  it("spawns at the nearest airport when no drones exist", () => {
    const decision = selectDispatchSource({
      target,
      drones: [],
      reservedDroneIds: new Set(),
      nextDispatchDroneId: "dispatch-drone-1",
    });

    expect(decision).toMatchObject({
      type: "spawn",
      droneId: "dispatch-drone-1",
      homeAirportIdent: "CYOW",
    });
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
      nextDispatchDroneId: "dispatch-drone-1",
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
      nextDispatchDroneId: "dispatch-drone-1",
    });

    expect(decision.type).toBe("spawn");
  });

  it("reuses the closest available non-route drone before spawning", () => {
    const drones: DispatchDroneCandidate[] = [
      {
        droneId: "dispatch-drone-1",
        lat: 45.33,
        lon: -75.67,
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
      nextDispatchDroneId: "dispatch-drone-2",
    });

    expect(decision).toEqual({
      type: "reuse",
      droneId: "dispatch-drone-1",
      homeAirportIdent: "CYOW",
    });
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
      nextDispatchDroneId: "dispatch-drone-1",
    });

    expect(decision.type).toBe("spawn");
  });

  it("skips drones already reserved for another assignment", () => {
    const drones: DispatchDroneCandidate[] = [
      {
        droneId: "dispatch-drone-1",
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
      reservedDroneIds: new Set(["dispatch-drone-1"]),
      nextDispatchDroneId: "dispatch-drone-2",
    });

    expect(decision).toMatchObject({
      type: "spawn",
      droneId: "dispatch-drone-2",
    });
  });

  it("reuses patrol on rejoin before comparing idle patrol to airport", () => {
    const drones: DispatchDroneCandidate[] = [
      {
        droneId: PATROL_ASSET_ID,
        lat: target.lat,
        lon: target.lon,
        origin: "patrol",
        patrol: { mode: "rejoin" },
        availability: "available",
        missionTargetId: null,
      },
    ];

    const decision = selectDispatchSource({
      target,
      drones,
      reservedDroneIds: new Set(),
      nextDispatchDroneId: "dispatch-drone-1",
    });

    expect(decision).toEqual({
      type: "reuse",
      droneId: PATROL_ASSET_ID,
      homeAirportIdent: null,
    });
  });
});
