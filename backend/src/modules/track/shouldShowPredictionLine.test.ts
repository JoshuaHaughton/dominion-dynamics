import { describe, expect, it } from "vitest";
import { testAsset } from "@dominion-dynamics/shared/testing";
import { shouldShowPredictionLine } from "./shouldShowPredictionLine.js";

describe("shouldShowPredictionLine", () => {
  it.each([
    {
      label: "hides for stationary assets",
      asset: testAsset({ speed: 0 }),
      expected: false,
    },
    {
      label: "hides for dispatch drones at base",
      asset: testAsset({
        role: "drone",
        speed: 80,
        zone: null,
        drone: {
          origin: "dispatch",
          dispatch: {
            targetId: "",
            phase: "at_base",
            homeAirportIdent: "CYOW",
          },
        },
      }),
      expected: false,
    },
    {
      label: "hides for patrol drones following a saved route",
      asset: testAsset({
        role: "drone",
        speed: 80,
        zone: null,
        drone: {
          origin: "patrol",
          patrol: { mode: "patrol", shadowTargetId: null, pathId: 1 },
        },
      }),
      expected: false,
    },
    {
      label: "shows for moving traffic",
      asset: testAsset({ speed: 120 }),
      expected: true,
    },
    {
      label: "shows for dispatch drones on an intercept mission",
      asset: testAsset({
        role: "drone",
        speed: 200,
        zone: null,
        drone: {
          origin: "dispatch",
          dispatch: {
            targetId: "critical-1",
            phase: "enroute",
            homeAirportIdent: "CYOW",
          },
        },
      }),
      expected: true,
    },
  ])("$label", ({ asset, expected }) => {
    expect(shouldShowPredictionLine(asset)).toBe(expected);
  });
});
