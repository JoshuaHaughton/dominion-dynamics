import { afterEach, describe, expect, it } from "vitest";
import { testAsset } from "../../testFixtures/asset.js";
import { getAirportByIdent } from "../airport/registry.js";
import {
  clearDispatchDroneStates,
  getDispatchDroneState,
  setDispatchDroneState,
} from "./dispatchDroneStore.js";
import { tickDispatchDrones } from "./dispatchTick.js";
import { createSpawnedDispatchDrone } from "./createDispatchDrone.js";
import type { DispatchMission } from "./types.js";

describe("tickDispatchDrones", () => {
  const mission: DispatchMission = {
    targetId: "critical-1",
    droneId: "dispatch-drone-1",
    assignmentSource: "spawn",
    homeAirportIdent: "CYOW",
    assignedAtMs: Date.now(),
  };

  afterEach(() => {
    clearDispatchDroneStates();
  });

  it("returns wire assets for active dispatch drones", () => {
    const cyow = getAirportByIdent("CYOW")!;
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
    expect(getDispatchDroneState("dispatch-drone-1")).toBeDefined();
  });

  it("removes despawned dispatch drones from the store", () => {
    const cyow = getAirportByIdent("CYOW")!;
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
    expect(getDispatchDroneState("dispatch-drone-1")).toBeUndefined();
  });
});
