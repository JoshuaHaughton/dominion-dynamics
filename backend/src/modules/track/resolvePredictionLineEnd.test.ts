import { describe, expect, it } from "vitest";
import { testAsset } from "../../testFixtures/asset.js";
import { getAirportByIdent } from "../airport/registry.js";
import { resolvePredictionLineEnd } from "./resolvePredictionLineEnd.js";

describe("resolvePredictionLineEnd", () => {
  const cyow = getAirportByIdent("CYOW")!;

  it("points RTB dispatch drones at their home airport", () => {
    const drone = testAsset({
      id: "dispatch-1",
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

    expect(
      resolvePredictionLineEnd({
        asset: drone,
        shadowTarget: null,
        dispatchTarget: null,
        rejoinTarget: null,
      }),
    ).toEqual({ lon: cyow.lon, lat: cyow.lat });
  });

  it("points active dispatch chase phases at the steer point toward the target", () => {
    const target = testAsset({
      id: "critical-1",
      lat: cyow.lat + 0.05,
      lon: cyow.lon + 0.05,
      heading: 90,
      speed: 200,
    });
    const drone = testAsset({
      id: "dispatch-1",
      role: "drone",
      lat: cyow.lat,
      lon: cyow.lon,
      zone: null,
      drone: {
        origin: "dispatch",
        dispatch: {
          targetId: target.id,
          phase: "enroute",
          homeAirportIdent: "CYOW",
        },
      },
    });

    const lineEnd = resolvePredictionLineEnd({
      asset: drone,
      shadowTarget: null,
      dispatchTarget: target,
      rejoinTarget: null,
    });

    expect(lineEnd).toBeDefined();
    expect(lineEnd?.lat).not.toBe(drone.lat);
  });

  it("points trailing dispatch drones at the target instead of the trail slot", () => {
    const target = testAsset({
      id: "critical-1",
      lat: cyow.lat + 0.02,
      lon: cyow.lon,
      heading: 90,
      speed: 200,
    });
    const drone = testAsset({
      id: "dispatch-1",
      role: "drone",
      lat: cyow.lat + 0.015,
      lon: cyow.lon,
      zone: null,
      drone: {
        origin: "dispatch",
        dispatch: {
          targetId: target.id,
          phase: "trailing",
          homeAirportIdent: "CYOW",
        },
      },
    });

    expect(
      resolvePredictionLineEnd({
        asset: drone,
        shadowTarget: null,
        dispatchTarget: target,
        rejoinTarget: null,
      }),
    ).toEqual({ lon: target.lon, lat: target.lat });
  });

  it("does not override prediction while at_base", () => {
    const drone = testAsset({
      id: "dispatch-1",
      role: "drone",
      zone: null,
      drone: {
        origin: "dispatch",
        dispatch: {
          targetId: "",
          phase: "at_base",
          homeAirportIdent: "CYOW",
        },
      },
    });

    expect(
      resolvePredictionLineEnd({
        asset: drone,
        shadowTarget: null,
        dispatchTarget: null,
        rejoinTarget: null,
      }),
    ).toBeUndefined();
  });
});
