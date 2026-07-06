import { describe, expect, it } from "vitest";
import { computeInterceptEtaSeconds } from "./computeInterceptEta.js";

describe("computeInterceptEtaSeconds", () => {
  const drone = {
    lat: 45.4,
    lon: -75.7,
    speed: 200,
  };

  // Due north of the drone by 0.009° latitude ≈ 1,001 m great-circle.
  const target = {
    lat: 45.409,
    lon: -75.7,
  };

  it("returns null when the drone is not closing on a target", () => {
    expect(computeInterceptEtaSeconds(drone, target, "trailing")).toBeNull();
    expect(computeInterceptEtaSeconds(drone, undefined, "enroute")).toBeNull();
  });

  it("estimates seconds from distance and closing speed while en-route", () => {
    // ~1,001 m at 200 m/s → ~5.0 s.
    const eta = computeInterceptEtaSeconds(drone, target, "enroute");

    expect(eta).not.toBeNull();
    expect(eta!).toBeGreaterThan(4.9);
    expect(eta!).toBeLessThan(5.1);
  });
});
