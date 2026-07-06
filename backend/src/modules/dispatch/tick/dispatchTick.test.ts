import { afterEach, describe, expect, it } from "vitest";
import {
  TEST_IDS,
  testAsset,
  testDispatchMission,
} from "@dominion-dynamics/shared/testing";
import { findAirportByIdent } from "../../airport/registry.js";
import {
  clearDispatchDroneStates,
  getDispatchDroneState,
  setDispatchDroneState,
} from "../drone/dispatchDroneStore.js";
import { tickDispatchDrones } from "./dispatchTick.js";
import { createSpawnedDispatchDrone } from "../drone/createDispatchDrone.js";
import type { DispatchMission } from "../types.js";

describe("tickDispatchDrones", () => {
  const DISPATCH_DRONE_ID = TEST_IDS.DISPATCH_DRONE;
  const mission: DispatchMission = testDispatchMission({
    assignedAtMs: Date.now(),
  });

  afterEach(() => {
    clearDispatchDroneStates();
  });

  it("returns wire assets for active dispatch drones", () => {
    const cyow = findAirportByIdent("CYOW")!;
    const state = createSpawnedDispatchDrone(
      mission,
      cyow.lat,
      cyow.lon,
      cyow.lat + 0.05,
      cyow.lon,
    );

    setDispatchDroneState(state.asset.id, state);

    const target = testAsset({
      id: "critical-1",
      lat: cyow.lat + 0.05,
      lon: cyow.lon,
      alt: 1000,
      heading: 90,
      speed: 200,
      zone: { threat: "critical", zoneTteSeconds: 0, nearestBoundaryM: 0 },
    });

    const drones = tickDispatchDrones({
      liveAssets: [target],
      deltaSeconds: 1,
    });

    expect(drones).toHaveLength(1);
    expect(drones[0]?.drone?.origin).toBe("dispatch");
    expect(drones[0]?.drone?.dispatch?.targetId).toBe("critical-1");
    expect(getDispatchDroneState(DISPATCH_DRONE_ID)).toBeDefined();
    expect(drones[0]?.callsign).toBe("Dispatch-1");
  });

  it("removes despawned dispatch drones from the store", () => {
    const cyow = findAirportByIdent("CYOW")!;
    const state = createSpawnedDispatchDrone(
      mission,
      cyow.lat,
      cyow.lon,
      cyow.lat,
      cyow.lon,
    );

    setDispatchDroneState(state.asset.id, {
      ...state,
      phase: "rtb",
      targetId: null,
      asset: {
        ...state.asset,
        lat: cyow.lat,
        lon: cyow.lon,
        speed: 0,
      },
    });

    const drones = tickDispatchDrones({
      liveAssets: [],
      deltaSeconds: 1,
    });

    expect(drones).toHaveLength(0);
    expect(getDispatchDroneState(DISPATCH_DRONE_ID)).toBeUndefined();
  });
});
