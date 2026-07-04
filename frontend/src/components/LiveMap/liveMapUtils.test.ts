import { describe, expect, it } from "vitest";
import { assetsToFeatureCollection } from "./liveMapUtils.js";
import type { Asset } from "@dominion-dynamics/shared";

describe("assetsToFeatureCollection", () => {
  const syntheticAsset: Asset = {
    id: "syn-test",
    lat: 45.4,
    lon: -75.7,
    alt: 1000,
    heading: 90,
    speed: 120,
    source: "synthetic",
  };

  const openskyAsset: Asset = {
    ...syntheticAsset,
    id: "os-test",
    source: "opensky",
  };

  it("returns an empty collection for no assets", () => {
    expect(assetsToFeatureCollection([])).toEqual({
      type: "FeatureCollection",
      features: [],
    });
  });

  it("maps assets to GeoJSON points with lon/lat order and layer properties", () => {
    const collection = assetsToFeatureCollection([syntheticAsset, openskyAsset]);

    expect(collection.features).toHaveLength(2);
    expect(collection.features[0]?.geometry.coordinates).toEqual([-75.7, 45.4]);
    expect(collection.features[0]?.properties).toEqual({
      id: "syn-test",
      source: "synthetic",
      heading: 90,
    });
    expect(collection.features[1]?.id).toBe("os-test");
    expect(collection.features[1]?.properties?.source).toBe("opensky");
  });
});
