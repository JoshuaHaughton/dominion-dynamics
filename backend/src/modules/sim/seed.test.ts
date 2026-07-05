import { afterEach, describe, expect, it, vi } from "vitest";
import { isInsideSeedRegion, respawnAtBoundary } from "./seed.js";
import type { Asset, SimBounds } from "@dominion-dynamics/shared";
import { SPEED_RANGE_BY_CATEGORY } from "./syntheticCategorySpawn.js";

function mockRespawnRandom(
  edgeRandom: number,
  edgePositionRandom = 0.5,
  headingJitterRandom = 0,
  categoryRandom = 0.99,
  speedRandom = 0,
): void {
  vi.spyOn(Math, "random")
    .mockReturnValueOnce(edgeRandom)
    .mockReturnValueOnce(edgePositionRandom)
    .mockReturnValueOnce(headingJitterRandom)
    .mockReturnValueOnce(categoryRandom)
    .mockReturnValueOnce(speedRandom);
}

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
    role: "traffic",
    category: 4,
    callsign: null,
    originCountry: null,
    onGround: false,
    threat: "normal",
    zoneTteSeconds: null,
    nearestZoneDistanceM: null,
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
      mockRespawnRandom(edgeRandom);

      const respawned = respawnAtBoundary(sampleAsset, ottawaRegion);

      expect(respawned.id).not.toBe(sampleAsset.id);
      expect(respawned.id).toMatch(/^syn-/);
      expect(respawned.lat).toBeCloseTo(expectedLat, 5);
      expect(respawned.lon).toBeCloseTo(expectedLon, 5);
      expect(respawned.heading).toBeGreaterThanOrEqual(0);
      expect(respawned.heading).toBeLessThan(360);
    },
  );

  it("preserves altitude and assigns a new category and speed", () => {
    mockRespawnRandom(0);

    const respawned = respawnAtBoundary(sampleAsset, ottawaRegion);

    expect(respawned.alt).toBe(sampleAsset.alt);
    expect(respawned.category).toBe(14);
    expect(respawned.speed).toBe(SPEED_RANGE_BY_CATEGORY[14].minMps);
    expect(respawned.callsign).toBeNull();
    expect(respawned.originCountry).toBeNull();
    expect(respawned.onGround).toBe(false);
    expect(respawned.role).toBe("traffic");
  });

  it("respawns as traffic when the exiting track was from OpenSky ingest", () => {
    mockRespawnRandom(0);

    const respawned = respawnAtBoundary(
      {
        ...sampleAsset,
        id: "abc123",
        role: "traffic",
        category: 8,
        callsign: "CFCO",
        originCountry: "Canada",
        onGround: false,
      },
      ottawaRegion,
    );

    expect(respawned.role).toBe("traffic");
    expect(respawned.callsign).toBeNull();
    expect(respawned.originCountry).toBeNull();
  });
});
