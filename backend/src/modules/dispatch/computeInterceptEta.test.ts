import { describe, expect, it } from "vitest";
import { computeInterceptEtaSeconds } from "./computeInterceptEta.js";

describe("computeInterceptEtaSeconds", () => {
  const drone = {
    lat: 45.4,
    lon: -75.7,
    speed: 200,
  };

  const target = {
    lat: 45.41,
    lon: -75.69,
  };

  it("returns null when the drone is not closing on a target", () => {
    expect(computeInterceptEtaSeconds(drone, target, "trailing")).toBeNull();
    expect(computeInterceptEtaSeconds(drone, undefined, "enroute")).toBeNull();
  });

  it("estimates seconds from distance and closing speed while en-route", () => {
    const eta = computeInterceptEtaSeconds(drone, target, "enroute");

    expect(eta).not.toBeNull();
    expect(eta!).toBeGreaterThan(0);
    expect(eta!).toBeLessThan(120);
  });
});
