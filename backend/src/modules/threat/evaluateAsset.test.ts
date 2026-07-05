import type { Feature, Polygon } from "geojson";
import { describe, expect, it } from "vitest";
import type { Asset } from "@dominion-dynamics/shared";
import { UNEVALUATED_THREAT } from "@dominion-dynamics/shared";
import { evaluateAssetThreat, enrichAssetsWithThreat } from "./evaluateAsset.js";
import { toCachedZone } from "./zoneGeometryCache.js";

/** Small square zone near Ottawa used across threat tests. */
const OTTAWA_TEST_ZONE_GEOJSON: Feature<Polygon> = {
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
  geojson: OTTAWA_TEST_ZONE_GEOJSON,
});

function testAsset(
  overrides: Partial<Asset> & Pick<Asset, "lat" | "lon" | "heading" | "speed">,
): Asset {
  return {
    id: "test-asset",
    alt: 5000,
    source: "synthetic",
    ...UNEVALUATED_THREAT,
    ...overrides,
  };
}

describe("evaluateAssetThreat", () => {
  it("returns normal when there are no zones", () => {
    const asset = testAsset({ lat: 45.4, lon: -75.7, heading: 90, speed: 120 });

    expect(evaluateAssetThreat(asset, [])).toEqual({
      threat: "normal",
      tteSeconds: null,
    });
  });

  it("returns critical with tte 0 when the asset is inside a zone", () => {
    const asset = testAsset({ lat: 45.4, lon: -75.7, heading: 90, speed: 120 });

    expect(evaluateAssetThreat(asset, [cachedZone])).toEqual({
      threat: "critical",
      tteSeconds: 0,
    });
  });

  it("returns warning when the asset is on a collision course within five minutes", () => {
    const asset = testAsset({ lat: 45.42, lon: -75.7, heading: 180, speed: 100 });

    const result = evaluateAssetThreat(asset, [cachedZone]);

    expect(result.threat).toBe("warning");
    expect(result.tteSeconds).not.toBeNull();
    expect(result.tteSeconds!).toBeGreaterThan(0);
    expect(result.tteSeconds!).toBeLessThanOrEqual(300);
  });

  it("returns normal when the asset flies parallel to the zone", () => {
    const asset = testAsset({ lat: 45.4, lon: -75.68, heading: 90, speed: 120 });

    expect(evaluateAssetThreat(asset, [cachedZone])).toEqual({
      threat: "normal",
      tteSeconds: null,
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
    expect(result.tteSeconds).not.toBeNull();
  });
});

describe("enrichAssetsWithThreat", () => {
  it("merges threat fields onto each asset", () => {
    const asset = testAsset({ lat: 45.4, lon: -75.7, heading: 0, speed: 100 });

    const [enriched] = enrichAssetsWithThreat([asset], [cachedZone]);

    expect(enriched).toMatchObject({
      id: "test-asset",
      threat: "critical",
      tteSeconds: 0,
    });
  });
});
