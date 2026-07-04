import { afterEach, describe, expect, it, vi } from "vitest";
import {
  pickSpeedProfile,
  sampleSpeedForProfile,
  sampleSyntheticSpeed,
  SPEED_PROFILES,
  SYNTHETIC_PROFILE_WEIGHTS,
} from "./speedProfiles.js";

describe("pickSpeedProfile", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns the profile matching a cumulative weight draw", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.1);

    expect(pickSpeedProfile()).toBe("ga");
  });

  it("returns commercial for mid-range draws", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);

    expect(pickSpeedProfile()).toBe("commercial");
  });

  it("returns drone for high-end draws", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.99);

    expect(pickSpeedProfile()).toBe("drone");
  });
});

describe("sampleSpeedForProfile", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("samples inside the profile bounds", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);

    const speed = sampleSpeedForProfile("drone");

    expect(speed).toBeGreaterThanOrEqual(SPEED_PROFILES.drone.minMps);
    expect(speed).toBeLessThanOrEqual(SPEED_PROFILES.drone.maxMps);
  });

  it("allows rotorcraft to be near hover speed", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);

    expect(sampleSpeedForProfile("rotorcraft")).toBe(0);
  });
});

describe("sampleSyntheticSpeed", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("samples from the profile selected by the weight draw", () => {
    vi.spyOn(Math, "random")
      .mockReturnValueOnce(0.99)
      .mockReturnValueOnce(0);

    expect(sampleSyntheticSpeed()).toBe(SPEED_PROFILES.drone.minMps);
  });
});

describe("SYNTHETIC_PROFILE_WEIGHTS", () => {
  it("sums to 1 so every draw maps to a profile", () => {
    const total = Object.values(SYNTHETIC_PROFILE_WEIGHTS).reduce(
      (sum, weight) => sum + weight,
      0,
    );

    expect(total).toBeCloseTo(1);
  });
});
