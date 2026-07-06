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
    role: "traffic",
    category: 0,
    callsign: null,
    originCountry: null,
    onGround: false,
    zone: { threat: "normal", zoneTteSeconds: null, nearestBoundaryM: null },
  };

  const warningAsset: Asset = {
    ...syntheticAsset,
    id: "warn-test",
    zone: { threat: "warning", zoneTteSeconds: 120, nearestBoundaryM: 500 },
  };

  it("returns an empty collection for no assets", () => {
    expect(assetsToFeatureCollection([])).toEqual({
      type: "FeatureCollection",
      features: [],
    });
  });

  it("maps route drones with mode for role-first map symbology", () => {
    const patrolAsset: Asset = {
      ...syntheticAsset,
      id: "patrol-1",
      role: "drone",
      zone: null,
      drone: {
        origin: "patrol",
        patrol: { mode: "shadow", shadowTargetId: "critical-1", pathId: 3 },
      },
    };

    const collection = assetsToFeatureCollection([patrolAsset]);

    expect(collection.features[0]?.properties).toEqual({
      id: "patrol-1",
      role: "drone",
      heading: 90,
      threat: "normal",
      patrolMode: "shadow",
      droneOrigin: "patrol",
    });
  });

  it("maps assets to GeoJSON points with lon/lat order and layer properties", () => {
    const collection = assetsToFeatureCollection([syntheticAsset, warningAsset]);

    expect(collection.features).toHaveLength(2);
    expect(collection.features[0]?.geometry.coordinates).toEqual([-75.7, 45.4]);
    expect(collection.features[0]?.properties).toEqual({
      id: "syn-test",
      role: "traffic",
      heading: 90,
      threat: "normal",
      patrolMode: "patrol",
      droneOrigin: "patrol",
    });
    expect(collection.features[1]?.id).toBe("warn-test");
    expect(collection.features[1]?.properties?.threat).toBe("warning");
  });
});
