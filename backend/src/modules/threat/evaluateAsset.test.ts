import { describe, expect, it } from "vitest";
import { evaluateAssetThreat } from "./evaluateAsset.js";
import { enrichTrafficWithZoneThreat } from "./enrichTrafficWithZoneThreat.js";
import { toCachedZone } from "./zoneGeometryCache.js";
import type { Asset } from "@dominion-dynamics/shared";
import { testAsset as makeAsset } from "../../testFixtures/asset.js";
import type { Feature, Polygon } from "geojson";

describe("evaluateAssetThreat", () => {
  const ottawaTestZoneGeojson: Feature<Polygon> = {
    type: "Feature",
    properties: {},
    geometry: {
      type: "Polygon",
      coordinates: [
        [
          [-75.71, 45.39],
          [-75.69, 45.39],
          [-75.69, 45.41],
          [-75.71, 45.41],
          [-75.71, 45.39],
        ],
      ],
    },
  };

  const cachedZone = toCachedZone({
    id: 1,
    name: "Test zone",
    geojson: ottawaTestZoneGeojson,
  });

  function testAsset(
    overrides: Partial<Asset> & Pick<Asset, "lat" | "lon" | "heading" | "speed">,
  ): Asset {
    return makeAsset({
      id: "test-asset",
      alt: 5000,
      ...overrides,
    });
  }

  it("returns normal when there are no zones", () => {
    const asset = testAsset({ lat: 45.4, lon: -75.7, heading: 90, speed: 120 });

    expect(evaluateAssetThreat(asset, [])).toEqual({
      threat: "normal",
      zoneTteSeconds: null,
    });
  });

  it("returns critical with zone TTE 0 when the asset is inside a zone", () => {
    const asset = testAsset({ lat: 45.4, lon: -75.7, heading: 90, speed: 120 });

    expect(evaluateAssetThreat(asset, [cachedZone])).toEqual({
      threat: "critical",
      zoneTteSeconds: 0,
    });
  });

  it("returns warning when the asset is on a collision course within five minutes", () => {
    const asset = testAsset({ lat: 45.42, lon: -75.7, heading: 180, speed: 100 });

    const result = evaluateAssetThreat(asset, [cachedZone]);

    expect(result.threat).toBe("warning");
    expect(result.zoneTteSeconds).not.toBeNull();
    expect(result.zoneTteSeconds!).toBeGreaterThan(0);
    expect(result.zoneTteSeconds!).toBeLessThanOrEqual(300);
  });

  it("returns normal when the asset flies parallel to the zone", () => {
    const asset = testAsset({ lat: 45.4, lon: -75.68, heading: 90, speed: 120 });

    expect(evaluateAssetThreat(asset, [cachedZone])).toEqual({
      threat: "normal",
      zoneTteSeconds: null,
    });
  });

  it("uses the nearest zone entry when multiple zones could apply", () => {
    const nearerZone = toCachedZone({
      id: 2,
      name: "Near zone",
      geojson: {
        type: "Feature",
        properties: {},
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [-75.705, 45.405],
              [-75.695, 45.405],
              [-75.695, 45.415],
              [-75.705, 45.415],
              [-75.705, 45.405],
            ],
          ],
        },
      },
    });

    const asset = testAsset({ lat: 45.42, lon: -75.7, heading: 180, speed: 100 });
    const result = evaluateAssetThreat(asset, [cachedZone, nearerZone]);

    expect(result.threat).toBe("warning");
    expect(result.zoneTteSeconds).not.toBeNull();
  });
});

describe("enrichTrafficWithZoneThreat", () => {
  const ottawaTestZoneGeojson: Feature<Polygon> = {
    type: "Feature",
    properties: {},
    geometry: {
      type: "Polygon",
      coordinates: [
        [
          [-75.71, 45.39],
          [-75.69, 45.39],
          [-75.69, 45.41],
          [-75.71, 45.41],
          [-75.71, 45.39],
        ],
      ],
    },
  };

  const cachedZone = toCachedZone({
    id: 1,
    name: "Test zone",
    geojson: ottawaTestZoneGeojson,
  });

  function testAsset(
    overrides: Partial<Asset> & Pick<Asset, "lat" | "lon" | "heading" | "speed">,
  ): Asset {
    return makeAsset({
      id: "test-asset",
      alt: 5000,
      ...overrides,
    });
  }

  it("merges zone-derived fields onto each asset", () => {
    const asset = testAsset({ lat: 45.4, lon: -75.7, heading: 0, speed: 100 });

    const [enriched] = enrichTrafficWithZoneThreat([asset], [cachedZone]);

    expect(enriched).toMatchObject({
      id: "test-asset",
      threat: "critical",
      zoneTteSeconds: 0,
      nearestZoneDistanceM: 0,
    });
  });
});
