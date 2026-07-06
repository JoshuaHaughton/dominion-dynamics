import { describe, expect, it } from "vitest";
import { testTrafficAsset } from "@dominion-dynamics/shared/testing";
import { assetsToFeatureCollection } from "./liveMapUtils.js";

// Symbology keys and ghost-emphasis math are covered by assetSymbology.test.ts;
// this file only checks the GeoJSON wiring.
describe("assetsToFeatureCollection", () => {
  const syntheticAsset = testTrafficAsset({ id: "syn-test", callsign: null });

  const warningAsset = testTrafficAsset({
    id: "warn-test",
    callsign: null,
    zone: { threat: "warning", zoneTteSeconds: 120, nearestBoundaryM: 500 },
  });

  it("returns an empty collection for no assets", () => {
    expect(assetsToFeatureCollection([])).toEqual({
      type: "FeatureCollection",
      features: [],
    });
  });

  it("maps assets to GeoJSON points with lon/lat order and layer properties", () => {
    const collection = assetsToFeatureCollection([
      syntheticAsset,
      warningAsset,
    ]);

    expect(collection.features).toHaveLength(2);
    expect(collection.features[0]?.geometry.coordinates).toEqual([-75.7, 45.4]);
    expect(collection.features[0]?.properties).toMatchObject({
      id: "syn-test",
      role: "traffic",
      heading: 90,
      markerShape: "circle",
      symbologyBodyKey: "traffic:normal",
      mapOpacity: 1,
      mapRadiusScale: 1,
    });
    expect(collection.features[1]?.properties?.symbologyBodyKey).toBe(
      "traffic:warning",
    );
  });
});
