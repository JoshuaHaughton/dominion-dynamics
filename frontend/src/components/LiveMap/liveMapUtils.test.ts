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

  it("maps patrol drones with shape and ring keys", () => {
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

    const criticalTarget: Asset = {
      ...syntheticAsset,
      id: "critical-1",
      zone: { threat: "critical", zoneTteSeconds: null, nearestBoundaryM: 0 },
    };

    const collection = assetsToFeatureCollection([patrolAsset, criticalTarget], {
      entityTab: "drones",
      statusFilter: "all",
      selectedAssetId: null,
    });

    expect(collection.features[0]?.properties).toMatchObject({
      id: "patrol-1",
      role: "drone",
      heading: 90,
      markerShape: "square",
      symbologyBodyKey: "patrol:shadow",
      symbologyRingKey: "drone-ring:critical-target",
      mapOpacity: 1,
      mapRadiusScale: 1,
    });
  });

  it("inverts selected assets to white fill with symbology-colored ring", () => {
    const patrolAsset: Asset = {
      ...syntheticAsset,
      id: "patrol-1",
      role: "drone",
      zone: null,
      drone: {
        origin: "patrol",
        patrol: { mode: "patrol", shadowTargetId: null, pathId: 3 },
      },
    };

    const collection = assetsToFeatureCollection([patrolAsset], {
      entityTab: "drones",
      statusFilter: "all",
      selectedAssetId: "patrol-1",
    });

    expect(collection.features[0]?.properties).toMatchObject({
      isSelected: true,
      isPatrolOrigin: true,
      symbologyBodyKey: "patrol:patrol",
      mapStrokeWidth: 3.5,
    });
    expect(collection.features[0]?.properties).not.toHaveProperty(
      "divertedFromPatrol",
    );
  });

  it("maps dispatch drones with square shape keys", () => {
    const dispatchAsset: Asset = {
      ...syntheticAsset,
      id: "dispatch-1",
      role: "drone",
      zone: null,
      drone: {
        origin: "patrol",
        dispatch: {
          targetId: "syn-test",
          phase: "trailing",
          homeAirportIdent: "CYOW",
        },
      },
    };

    const collection = assetsToFeatureCollection([syntheticAsset, dispatchAsset]);

    expect(collection.features[1]?.properties).toMatchObject({
      markerShape: "square",
      symbologyBodyKey: "dispatch:trailing",
      symbologyRingKey: "drone-ring:default",
      isPatrolOrigin: true,
    });
  });

  it("maps assets to GeoJSON points with lon/lat order and layer properties", () => {
    const collection = assetsToFeatureCollection([syntheticAsset, warningAsset]);

    expect(collection.features).toHaveLength(2);
    expect(collection.features[0]?.geometry.coordinates).toEqual([-75.7, 45.4]);
    expect(collection.features[0]?.properties).toMatchObject({
      id: "syn-test",
      role: "traffic",
      markerShape: "circle",
      symbologyBodyKey: "traffic:normal",
    });
    expect(collection.features[1]?.properties?.symbologyBodyKey).toBe(
      "traffic:warning",
    );
  });

  it("ghosts non-matching assets when a specific chip is active", () => {
    const collection = assetsToFeatureCollection([syntheticAsset, warningAsset], {
      entityTab: "traffic",
      statusFilter: "warning",
      selectedAssetId: null,
    });

    expect(collection.features[0]?.properties?.mapOpacity).toBe(0.65);
    expect(collection.features[0]?.properties?.mapRadiusScale).toBe(0.85);
    expect(collection.features[1]?.properties?.mapOpacity).toBe(1);
  });
});
