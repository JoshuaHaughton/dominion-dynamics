import { describe, expect, it } from "vitest";
import { PATROL_ASSET_ID } from "@dominion-dynamics/shared";
import {
  testAsset,
  testDispatchMission,
} from "@dominion-dynamics/shared/testing";
import {
  applyDispatchAssignment,
  createDispatchDroneFromAsset,
} from "./createDispatchDrone.js";
import type { DispatchMission } from "../types.js";

describe("applyDispatchAssignment", () => {
  const patrolAsset = testAsset({
    id: PATROL_ASSET_ID,
    lat: 45.35,
    lon: -75.65,
    alt: 500,
    heading: 90,
    speed: 80,
    role: "drone",
    zone: null,
    drone: {
      origin: "patrol",
      patrol: { mode: "rejoin", shadowTargetId: null, pathId: 1 },
    },
  });

  it("keeps patrol origin when reusing the patrol slot on a reuse decision", () => {
    const mission: DispatchMission = testDispatchMission({
      droneId: PATROL_ASSET_ID,
      assignmentSource: "reuse",
      homeAirportIdent: null,
    });

    const state = applyDispatchAssignment(
      mission,
      { type: "reuse", droneId: PATROL_ASSET_ID, homeAirportIdent: null },
      { lat: 45.4, lon: -75.7 },
      patrolAsset,
    );

    expect(state.origin).toBe("patrol");
  });

  it("sets patrol origin on a fresh patrol diversion", () => {
    const mission: DispatchMission = testDispatchMission({
      droneId: PATROL_ASSET_ID,
      assignmentSource: "patrol",
      homeAirportIdent: null,
    });

    const state = applyDispatchAssignment(
      mission,
      { type: "patrol", droneId: PATROL_ASSET_ID },
      { lat: 45.4, lon: -75.7 },
      patrolAsset,
    );

    expect(state.origin).toBe("patrol");
  });

  it("sets dispatch origin when reusing a dispatch-born drone", () => {
    const dispatchAsset = testAsset({
      id: "dispatch-drone-1",
      lat: 45.32,
      lon: -75.67,
      alt: 500,
      heading: 0,
      speed: 0,
      role: "drone",
      zone: null,
      drone: {
        origin: "dispatch",
        dispatch: {
          targetId: "",
          phase: "rtb",
          homeAirportIdent: "CYOW",
        },
      },
    });

    const mission: DispatchMission = testDispatchMission({
      targetId: "critical-2",
      droneId: "dispatch-drone-1",
      assignmentSource: "reuse",
    });

    const state = createDispatchDroneFromAsset(
      mission,
      dispatchAsset,
      "dispatch",
    );

    expect(state.origin).toBe("dispatch");
  });
});
