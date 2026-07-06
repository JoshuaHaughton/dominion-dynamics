import { afterEach, describe, expect, it } from "vitest";
import { testAsset } from "../../testFixtures/asset.js";
import { getAirportByIdent } from "../airport/registry.js";
import {
  clearDispatchDroneStates,
  getDispatchDroneState,
  getDispatchDroneStates,
} from "./dispatchDroneStore.js";
import {
  clearDispatchMissions,
  getDispatchMission,
  listDispatchMissions,
} from "./missionStore.js";
import { syncDispatchAllocator } from "./syncDispatchAllocator.js";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

    const mission = getDispatchMission("critical-1");

    expect(listDispatchMissions()).toHaveLength(1);
    expect(mission).toMatchObject({
      assignmentSource: "spawn",
      homeAirportIdent: "CYOW",
    });
    expect(mission?.droneId).toMatch(UUID_PATTERN);

    const state = getDispatchDroneState(mission!.droneId);

    expect(state).toMatchObject({
      phase: "enroute",
      targetId: "critical-1",
    });
    expect(state?.asset.callsign).toBe("Dispatch-1");
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
    const firstDroneId = getDispatchMission("critical-1")!.droneId;

    syncDispatchAllocator([critical], 1_700_000_000_100);

    expect(getDispatchMission("critical-1")?.droneId).toBe(firstDroneId);
    expect(getDispatchDroneState(firstDroneId)?.targetId).toBe("critical-1");
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
    const droneId = getDispatchMission("critical-1")!.droneId;

    syncDispatchAllocator([normal], 1_700_000_000_100);

    expect(listDispatchMissions()).toHaveLength(0);
    expect(getDispatchDroneState(droneId)).toBeDefined();
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
    expect(getDispatchDroneStates().size).toBe(0);
  });
});
