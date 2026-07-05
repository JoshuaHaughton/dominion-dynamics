import { afterEach, describe, expect, it, vi } from "vitest";
import {
  pickSyntheticCategory,
  sampleSpeedForCategory,
  sampleSyntheticMotion,
  SPEED_RANGE_BY_CATEGORY,
  SYNTHETIC_CATEGORY_WEIGHTS,
} from "./syntheticCategorySpawn.js";

describe("pickSyntheticCategory", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns light aircraft for low draws", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.05);

    expect(pickSyntheticCategory()).toBe(2);
  });

  it("returns large aircraft for mid-range draws", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.3);

    expect(pickSyntheticCategory()).toBe(4);
  });

  it("returns unmanned aerial vehicle for high-end draws", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.99);

    expect(pickSyntheticCategory()).toBe(14);
  });
});

describe("sampleSpeedForCategory", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("samples inside the category bounds", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);

    const speed = sampleSpeedForCategory(14);

    expect(speed).toBeGreaterThanOrEqual(SPEED_RANGE_BY_CATEGORY[14].minMps);
    expect(speed).toBeLessThanOrEqual(SPEED_RANGE_BY_CATEGORY[14].maxMps);
  });

  it("allows rotorcraft to be near hover speed", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);

    expect(sampleSpeedForCategory(8)).toBe(0);
  });
});

describe("sampleSyntheticMotion", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("samples from the category selected by the weight draw", () => {
    vi.spyOn(Math, "random")
      .mockReturnValueOnce(0.99)
      .mockReturnValueOnce(0);

    expect(sampleSyntheticMotion()).toEqual({
      category: 14,
      speed: SPEED_RANGE_BY_CATEGORY[14].minMps,
    });
  });
});

describe("SYNTHETIC_CATEGORY_WEIGHTS", () => {
  it("sums to 1 so every draw maps to a category", () => {
    const total = Object.values(SYNTHETIC_CATEGORY_WEIGHTS).reduce(
      (sum, weight) => sum + weight,
      0,
    );

    expect(total).toBeCloseTo(1);
  });
});
