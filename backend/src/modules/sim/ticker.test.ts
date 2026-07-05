import { describe, expect, it } from "vitest";
import { advanceAssets } from "./ticker.js";
import { isInsideSeedRegion } from "./seed.js";
import type { Asset, SimBounds } from "@dominion-dynamics/shared";
import { testAsset } from "../../testFixtures/asset.js";

describe("advanceAssets", () => {
  const ottawaRegion: SimBounds = {
    minLat: 45.2,
    maxLat: 45.6,
    minLon: -76.1,
    maxLon: -75.3,
  };

  const baseAsset: Asset = testAsset({
    id: "track-inside",
    lat: 45.4,
    lon: -75.7,
    alt: 5000,
    heading: 90,
    speed: 100,
  });

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

  it("respawns with a new id when a track exits the seed region", () => {
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

    expect(next.id).not.toBe(exitingAsset.id);
    expect(next.id).toMatch(/^syn-/);
    expect(isInsideSeedRegion(next, ottawaRegion)).toBe(true);
  });
});
