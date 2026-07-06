import { afterEach, describe, expect, it } from "vitest";
import { testAsset } from "../../testFixtures/asset.js";
import { getAirportByIdent } from "../airport/registry.js";
import {
  clearDispatchDroneStates,
  getDispatchDroneState,
} from "./dispatchDroneStore.js";
import {
  clearDispatchMissions,
  getDispatchMission,
  listDispatchMissions,
} from "./missionStore.js";
import { syncDispatchAllocator } from "./syncDispatchAllocator.js";

describe("syncDispatchAllocator", () => {
  const cyow = getAirportByIdent("CYOW")!;

  afterEach(() => {
    clearDispatchMissions();
    clearDispatchDroneStates();
  });

  it("spawns a dispatch drone when a critical target appears", () => {
    const critical = testAsset({
      id: "critical-1",
      lat: cyow.lat + 0.05,
      lon: cyow.lon,
      alt: 1000,
      heading: 90,
      speed: 200,
      zone: { threat: "critical", zoneTteSeconds: 0, nearestBoundaryM: 0 },
    });

    syncDispatchAllocator([critical], 1_700_000_000_000);

    expect(listDispatchMissions()).toHaveLength(1);
    expect(getDispatchMission("critical-1")).toMatchObject({
      droneId: "dispatch-drone-1",
      assignmentSource: "spawn",
      homeAirportIdent: "CYOW",
    });
    expect(getDispatchDroneState("dispatch-drone-1")).toMatchObject({
      phase: "enroute",
      targetId: "critical-1",
    });
  });

  it("keeps sticky missions while the target stays critical", () => {
    const critical = testAsset({
      id: "critical-1",
      lat: cyow.lat + 0.05,
      lon: cyow.lon,
      alt: 1000,
      heading: 90,
      speed: 200,
      zone: { threat: "critical", zoneTteSeconds: 0, nearestBoundaryM: 0 },
    });

    syncDispatchAllocator([critical], 1_700_000_000_000);
    syncDispatchAllocator([critical], 1_700_000_000_100);

    expect(listDispatchMissions()).toHaveLength(1);
    expect(getDispatchDroneState("dispatch-drone-1")?.targetId).toBe(
      "critical-1",
    );
  });

  it("releases missions when a target is no longer critical", () => {
    const critical = testAsset({
      id: "critical-1",
      lat: cyow.lat + 0.05,
      lon: cyow.lon,
      alt: 1000,
      heading: 90,
      speed: 200,
      zone: { threat: "critical", zoneTteSeconds: 0, nearestBoundaryM: 0 },
    });
    const normal = testAsset({
      ...critical,
      zone: { threat: "normal", zoneTteSeconds: null, nearestBoundaryM: 100 },
    });

    syncDispatchAllocator([critical], 1_700_000_000_000);
    syncDispatchAllocator([normal], 1_700_000_000_100);

    expect(listDispatchMissions()).toHaveLength(0);
    expect(getDispatchDroneState("dispatch-drone-1")).toBeDefined();
  });

  it("does nothing when no traffic is critical", () => {
    const normal = testAsset({
      id: "track-1",
      lat: cyow.lat,
      lon: cyow.lon,
      alt: 1000,
      heading: 90,
      speed: 200,
      zone: { threat: "normal", zoneTteSeconds: null, nearestBoundaryM: 100 },
    });

    syncDispatchAllocator([normal], 1_700_000_000_000);

    expect(listDispatchMissions()).toHaveLength(0);
    expect(getDispatchDroneState("dispatch-drone-1")).toBeUndefined();
  });
});
