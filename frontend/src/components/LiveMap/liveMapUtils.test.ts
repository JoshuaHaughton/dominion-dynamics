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

  it("maps asset coordinates to GeoJSON format", () => {
    const collection = assetsToFeatureCollection([syntheticAsset]);

    expect(collection.features[0]?.geometry.coordinates).toEqual([-75.7, 45.4]);
    expect(collection.features[0]?.properties?.source).toBe("synthetic");
  });

  it("preserves feature ids and source for multiple assets", () => {
    const collection = assetsToFeatureCollection([
      syntheticAsset,
      openskyAsset,
    ]);

    expect(collection.features).toHaveLength(2);
    expect(collection.features.map((feature) => feature.id)).toEqual([
      "syn-test",
      "os-test",
    ]);
    expect(
      collection.features.map((feature) => feature.properties?.source),
    ).toEqual(["synthetic", "opensky"]);
  });
});
