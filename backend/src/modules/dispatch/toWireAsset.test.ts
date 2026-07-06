import { describe, expect, it } from "vitest";
import { TEST_IDS, testAsset } from "@dominion-dynamics/shared/testing";
import { dispatchAssetFromState } from "./toWireAsset.js";
import type { DispatchDroneState } from "./types.js";

describe("dispatchAssetFromState", () => {
  function dispatchState(
    overrides: Partial<DispatchDroneState> = {},
  ): DispatchDroneState {
    return {
      phase: "enroute",
      targetId: "critical-1",
      assignmentSource: "spawn",
      homeAirportIdent: "CYOW",
      origin: "dispatch",
      asset: testAsset({
        id: TEST_IDS.DISPATCH_DRONE,
        role: "drone",
        speed: 200,
        zone: null,
      }),
      ...overrides,
    };
  }

  it("merges dispatch sim fields and an intercept ETA onto the wire asset", () => {
    const target = testAsset({
      id: "critical-1",
      lat: 45.41,
      lon: -75.7,
      zone: { threat: "critical", zoneTteSeconds: 0, nearestBoundaryM: 0 },
    });
    const state = dispatchState({
      asset: testAsset({
        id: TEST_IDS.DISPATCH_DRONE,
        role: "drone",
        lat: 45.4,
        lon: -75.7,
        speed: 200,
        zone: null,
      }),
    });

    const wire = dispatchAssetFromState(state, [target]);

    expect(wire.role).toBe("drone");
    expect(wire.zone).toBeNull();
    expect(wire.drone?.dispatch).toMatchObject({
      targetId: "critical-1",
      phase: "enroute",
      homeAirportIdent: "CYOW",
    });
    expect(wire.drone?.dispatch?.homeAirportName).toContain("Ottawa");
    expect(wire.drone?.dispatch?.interceptEtaSeconds).toBeGreaterThan(0);
  });

  it("uses an empty targetId and no ETA once the mission is released", () => {
    const wire = dispatchAssetFromState(
      dispatchState({ phase: "rtb", targetId: null }),
    );

    expect(wire.drone?.dispatch).toMatchObject({
      targetId: "",
      phase: "rtb",
      interceptEtaSeconds: null,
    });
  });

  it("leaves the airport name undefined for unknown idents", () => {
    const wire = dispatchAssetFromState(
      dispatchState({ homeAirportIdent: "XXXX" }),
    );

    expect(wire.drone?.dispatch?.homeAirportName).toBeUndefined();
    expect(wire.drone?.dispatch?.homeAirportIdent).toBe("XXXX");
  });
});
