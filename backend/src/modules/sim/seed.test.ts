import { afterEach, describe, expect, it, vi } from "vitest";
import { isInsideSeedRegion, respawnAtBoundary } from "./seed.js";
import type { Asset, SimBounds } from "@dominion-dynamics/shared";
import { UNEVALUATED_THREAT } from "@dominion-dynamics/shared";

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

  it("returns true for a point on the bbox boundary", () => {
    expect(
      isInsideSeedRegion(
        { lat: ottawaRegion.maxLat, lon: -75.7 },
        ottawaRegion,
      ),
    ).toBe(true);
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
    id: "legacy-track",
    lat: 45.4,
    lon: -75.7,
    alt: 5000,
    heading: 180,
    speed: 120,
    source: "synthetic",
    ...UNEVALUATED_THREAT,
  };

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each([
    {
      edgeRandom: 0,
      expectedLat: ottawaRegion.maxLat,
      expectedLon: -75.7,
      label: "north",
    },
    {
      edgeRandom: 0.25,
      expectedLat: ottawaRegion.minLat,
      expectedLon: -75.7,
      label: "south",
    },
    {
      edgeRandom: 0.5,
      expectedLat: 45.4,
      expectedLon: ottawaRegion.maxLon,
      label: "east",
    },
    {
      edgeRandom: 0.75,
      expectedLat: 45.4,
      expectedLon: ottawaRegion.minLon,
      label: "west",
    },
  ])(
    "assigns a new id on the $label edge",
    ({ edgeRandom, expectedLat, expectedLon }) => {
      vi.spyOn(Math, "random")
        .mockReturnValueOnce(edgeRandom)
        .mockReturnValueOnce(0.5)
        .mockReturnValueOnce(0);

      const respawned = respawnAtBoundary(sampleAsset, ottawaRegion);

      expect(respawned.id).not.toBe(sampleAsset.id);
      expect(respawned.id).toMatch(/^syn-/);
      expect(respawned.lat).toBeCloseTo(expectedLat, 5);
      expect(respawned.lon).toBeCloseTo(expectedLon, 5);
      expect(respawned.heading).toBeGreaterThanOrEqual(0);
      expect(respawned.heading).toBeLessThan(360);
    },
  );

  it("preserves altitude and speed from the exiting track", () => {
    vi.spyOn(Math, "random")
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0.5)
      .mockReturnValueOnce(0);

    const respawned = respawnAtBoundary(sampleAsset, ottawaRegion);

    expect(respawned.alt).toBe(sampleAsset.alt);
    expect(respawned.speed).toBe(sampleAsset.speed);
    expect(respawned.source).toBe("synthetic");
  });

  it("sets source to synthetic when the exiting track was from OpenSky", () => {
    vi.spyOn(Math, "random")
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0.5)
      .mockReturnValueOnce(0);

    const respawned = respawnAtBoundary(
      { ...sampleAsset, id: "abc123", source: "opensky" },
      ottawaRegion,
    );

    expect(respawned.source).toBe("synthetic");
  });
});
