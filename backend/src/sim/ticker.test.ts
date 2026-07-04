import { describe, expect, it } from "vitest";
import { advanceAssets } from "./ticker.js";
import { isInsideSeedRegion } from "./seed.js";
import type { Asset, SimBounds } from "./types.js";

describe("advanceAssets", () => {
  const ottawaRegion: SimBounds = {
    minLat: 45.2,
    maxLat: 45.6,
    minLon: -76.1,
    maxLon: -75.3,
  };

  const baseAsset: Asset = {
    id: "sim-1",
    lat: 45.4,
    lon: -75.7,
    alt: 5000,
    heading: 90,
    speed: 100,
    source: "synthetic",
  };

  it("advances assets that remain inside the seed region", () => {
    const [next] = advanceAssets({
      assets: [baseAsset],
      deltaSeconds: 1,
      seedRegion: ottawaRegion,
    });

    expect(next.id).toBe(baseAsset.id);
    expect(next.lon).toBeGreaterThan(baseAsset.lon);
    expect(isInsideSeedRegion(next, ottawaRegion)).toBe(true);
  });

  it("respawns with the same id when a track exits the seed region", () => {
    const exitingAsset: Asset = {
      ...baseAsset,
      lat: 45.599,
      heading: 0,
      speed: 250,
    };

    const [next] = advanceAssets({
      assets: [exitingAsset],
      deltaSeconds: 1,
      seedRegion: ottawaRegion,
    });

    expect(next.id).toBe(exitingAsset.id);
    expect(isInsideSeedRegion(next, ottawaRegion)).toBe(true);
  });
});
