import { afterEach, describe, expect, it, vi } from "vitest";
import { isInsideSeedRegion, respawnAtBoundary } from "./seed.js";
import type { Asset, SimBounds } from "./types.js";

describe("isInsideSeedRegion", () => {
  const ottawaRegion: SimBounds = {
    minLat: 45.2,
    maxLat: 45.6,
    minLon: -76.1,
    maxLon: -75.3,
  };

  it("returns true for a point inside the bbox", () => {
    expect(isInsideSeedRegion({ lat: 45.4, lon: -75.7 }, ottawaRegion)).toBe(
      true,
    );
  });

  it("returns false for a point outside the bbox", () => {
    expect(isInsideSeedRegion({ lat: 46.0, lon: -75.7 }, ottawaRegion)).toBe(
      false,
    );
  });
});

describe("respawnAtBoundary", () => {
  const ottawaRegion: SimBounds = {
    minLat: 45.2,
    maxLat: 45.6,
    minLon: -76.1,
    maxLon: -75.3,
  };

  const sampleAsset: Asset = {
    id: "sim-42",
    lat: 45.4,
    lon: -75.7,
    alt: 5000,
    heading: 180,
    speed: 120,
    source: "synthetic",
  };

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("keeps the same id and places the asset on the north edge", () => {
    vi.spyOn(Math, "random")
      .mockReturnValueOnce(0) // north edge
      .mockReturnValueOnce(0.5) // lon along edge
      .mockReturnValueOnce(0); // heading jitter

    const respawned = respawnAtBoundary(sampleAsset, ottawaRegion);

    expect(respawned.id).toBe(sampleAsset.id);
    expect(respawned.lat).toBe(ottawaRegion.maxLat);
    expect(respawned.lon).toBeCloseTo(-75.7, 5);
    expect(respawned.heading).toBeGreaterThanOrEqual(0);
    expect(respawned.heading).toBeLessThan(360);
  });
});
