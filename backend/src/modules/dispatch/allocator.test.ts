import { afterEach, describe, expect, it } from "vitest";
import { PATROL_ASSET_ID } from "@dominion-dynamics/shared";
import { syncDispatchMissions } from "./allocator.js";
import {
  clearDispatchMissions,
  listDispatchMissions,
  setDispatchMissions,
} from "./missionStore.js";
import type { DispatchDroneCandidate, DispatchMission } from "./types.js";

describe("syncDispatchMissions", () => {
  const nowMs = 1_700_000_000_000;
  const targetA = { id: "critical-a", lat: 45.3225, lon: -75.6692 };
  const targetB = { id: "critical-b", lat: 45.4, lon: -75.7 };

  const freePatrolAtTarget: DispatchDroneCandidate = {
    droneId: PATROL_ASSET_ID,
    lat: 45.323,
    lon: -75.669,
    origin: "patrol",
    patrol: { mode: "patrol" },
    availability: "available",
    missionTargetId: null,
  };

  afterEach(() => {
    clearDispatchMissions();
  });

  it("creates a spawn assignment for a new critical target", () => {
    const result = syncDispatchMissions({
      criticalTargets: [targetA],
      drones: [],
      missions: new Map(),
      nowMs,
      nextDispatchDroneIndex: 1,
    });

    expect(result.assignments).toHaveLength(1);
    expect(result.assignments[0]?.decision.type).toBe("spawn");
    expect(result.missions.get("critical-a")).toMatchObject({
      droneId: "dispatch-drone-1",
      assignmentSource: "spawn",
      homeAirportIdent: "CYOW",
    });
    expect(result.nextDispatchDroneIndex).toBe(2);
  });

  it("keeps sticky assignments while the target stays critical", () => {
    const existing: DispatchMission = {
      targetId: "critical-a",
      droneId: "dispatch-drone-1",
      assignmentSource: "spawn",
      homeAirportIdent: "CYOW",
      assignedAtMs: nowMs - 5_000,
    };

    const result = syncDispatchMissions({
      criticalTargets: [targetA],
      drones: [
        {
          droneId: "dispatch-drone-1",
          lat: 45.33,
          lon: -75.67,
          origin: "dispatch",
          availability: "busy",
          missionTargetId: "critical-a",
          homeAirportIdent: "CYOW",
        },
      ],
      missions: new Map([["critical-a", existing]]),
      nowMs,
      nextDispatchDroneIndex: 2,
    });

    expect(result.assignments).toHaveLength(0);
    expect(result.releasedTargetIds).toEqual([]);
    expect(result.missions.get("critical-a")).toEqual(existing);
  });

  it("releases missions when a target is no longer critical", () => {
    const existing: DispatchMission = {
      targetId: "critical-a",
      droneId: "dispatch-drone-1",
      assignmentSource: "spawn",
      homeAirportIdent: "CYOW",
      assignedAtMs: nowMs - 5_000,
    };

    const result = syncDispatchMissions({
      criticalTargets: [],
      drones: [],
      missions: new Map([["critical-a", existing]]),
      nowMs,
      nextDispatchDroneIndex: 2,
    });

    expect(result.releasedTargetIds).toEqual(["critical-a"]);
    expect(result.missions.size).toBe(0);
  });

  it("assigns two critical targets without double-booking one drone", () => {
    const result = syncDispatchMissions({
      criticalTargets: [targetA, targetB],
      drones: [freePatrolAtTarget],
      missions: new Map(),
      nowMs,
      nextDispatchDroneIndex: 1,
    });

    expect(result.assignments).toHaveLength(2);

    const droneIds = [...result.missions.values()].map((mission) => mission.droneId);
    expect(new Set(droneIds).size).toBe(2);
  });

  it("assigns the closest critical target first when one drone is available", () => {
    const patrolAtTargetA: DispatchDroneCandidate = {
      ...freePatrolAtTarget,
      lat: targetA.lat,
      lon: targetA.lon,
    };

    const result = syncDispatchMissions({
      criticalTargets: [targetB, targetA],
      drones: [patrolAtTargetA],
      missions: new Map(),
      nowMs,
      nextDispatchDroneIndex: 1,
    });

    expect(result.assignments[0]).toMatchObject({
      targetId: "critical-a",
      decision: { type: "patrol", droneId: PATROL_ASSET_ID },
    });
    expect(result.assignments[1]?.targetId).toBe("critical-b");
    expect(result.assignments[1]?.decision.type).toBe("spawn");
    expect(result.missions.get("critical-a")).toMatchObject({
      assignmentSource: "patrol",
      homeAirportIdent: null,
    });
  });

  it("releases a mission when the assigned drone no longer exists", () => {
    const existing: DispatchMission = {
      targetId: "critical-a",
      droneId: "dispatch-drone-9",
      assignmentSource: "spawn",
      homeAirportIdent: "CYOW",
      assignedAtMs: nowMs - 1_000,
    };

    const result = syncDispatchMissions({
      criticalTargets: [targetA],
      drones: [],
      missions: new Map([["critical-a", existing]]),
      nowMs,
      nextDispatchDroneIndex: 1,
    });

    expect(result.releasedTargetIds).toEqual(["critical-a"]);
    expect(result.assignments).toHaveLength(1);
    expect(result.assignments[0]?.decision.type).toBe("spawn");
  });

  it("writes allocator output into the mission store helper", () => {
    const result = syncDispatchMissions({
      criticalTargets: [targetA],
      drones: [],
      missions: new Map(),
      nowMs,
      nextDispatchDroneIndex: 1,
    });

    setDispatchMissions(result.missions);

    expect(listDispatchMissions()).toHaveLength(1);
    expect(listDispatchMissions()[0]?.targetId).toBe("critical-a");
  });

  it("reuses an idle dispatch drone before allocating a new spawn id", () => {
    const result = syncDispatchMissions({
      criticalTargets: [targetA],
      drones: [
        {
          droneId: "dispatch-drone-1",
          lat: 45.323,
          lon: -75.669,
          origin: "dispatch",
          availability: "available",
          missionTargetId: null,
          homeAirportIdent: "CYOW",
        },
      ],
      missions: new Map(),
      nowMs,
      nextDispatchDroneIndex: 2,
    });

    expect(result.assignments[0]?.decision).toMatchObject({
      type: "reuse",
      droneId: "dispatch-drone-1",
    });
    expect(result.missions.get("critical-a")).toMatchObject({
      assignmentSource: "reuse",
      homeAirportIdent: "CYOW",
    });
    expect(result.nextDispatchDroneIndex).toBe(2);
  });
});
