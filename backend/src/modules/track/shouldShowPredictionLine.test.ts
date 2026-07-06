import { describe, expect, it } from "vitest";
import { testAsset } from "../../testFixtures/asset.js";
import { shouldShowPredictionLine } from "./shouldShowPredictionLine.js";

describe("shouldShowPredictionLine", () => {
  it("hides prediction for stationary assets", () => {
    expect(shouldShowPredictionLine(testAsset({ speed: 0 }))).toBe(false);
  });

  it("hides prediction for dispatch drones at base", () => {
    expect(
      shouldShowPredictionLine(
        testAsset({
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
      ),
    ).toBe(false);
  });

  it("hides prediction for patrol drones following a saved route", () => {
    expect(
      shouldShowPredictionLine(
        testAsset({
          role: "drone",
          speed: 80,
          zone: null,
          drone: {
            origin: "patrol",
            patrol: { mode: "patrol", shadowTargetId: null, pathId: 1 },
          },
        }),
      ),
    ).toBe(false);
  });

  it("shows prediction for moving traffic", () => {
    expect(shouldShowPredictionLine(testAsset({ speed: 120 }))).toBe(true);
  });

  it("shows prediction for dispatch drones on an intercept mission", () => {
    expect(
      shouldShowPredictionLine(
        testAsset({
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
      ),
    ).toBe(true);
  });
});
