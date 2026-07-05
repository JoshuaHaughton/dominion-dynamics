import type { Feature, Polygon } from "geojson";
import { describe, expect, it } from "vitest";
import type { AssetHistoryPoint } from "@dominion-dynamics/shared";
import { testAsset } from "../../testFixtures/asset.js";
import { nearestZoneDistanceM } from "./nearestZoneDistance.js";
import { predictAssetPath } from "./predictPath.js";
import { toCachedZone } from "./zoneGeometryCache.js";

const zonePolygon: Feature<Polygon> = {
  type: "Feature",
  properties: {},
  geometry: {
    type: "Polygon",
    coordinates: [
      [
        [-75.8, 45.3],
        [-75.6, 45.3],
        [-75.6, 45.45],
        [-75.8, 45.45],
        [-75.8, 45.3],
      ],
    ],
  },
};

const baseAsset = testAsset({
  id: "track-1",
  lat: 45.35,
  lon: -75.7,
  alt: 5000,
  heading: 90,
  speed: 100,
});

describe("nearestZoneDistanceM", () => {
  it("returns 0 when the asset is inside a zone", () => {
    const inside = { ...baseAsset, lat: 45.4, lon: -75.7 };

    expect(nearestZoneDistanceM(inside, [toCachedZone({
      id: 1,
      name: "Z1",
      geojson: zonePolygon,
    })])).toBe(0);
  });

  it("returns a positive distance when outside", () => {
    const outside = { ...baseAsset, lat: 45.25, lon: -75.7 };
    const distanceM = nearestZoneDistanceM(outside, [
      toCachedZone({ id: 1, name: "Z1", geojson: zonePolygon }),
    ]);

    expect(distanceM).not.toBeNull();
    expect(distanceM!).toBeGreaterThan(0);
  });
});

describe("predictAssetPath", () => {
  it("projects a forward line from history-derived motion", () => {
    const history: AssetHistoryPoint[] = [
      { lat: 45.35, lon: -75.75, ts: 0 },
      { lat: 45.35, lon: -75.7, ts: 60_000 },
    ];

    const path = predictAssetPath(baseAsset, history);

    expect(path.coordinates).toHaveLength(2);
    expect(path.coordinates[0]).toEqual([-75.7, 45.35]);
    expect(path.coordinates[1]?.[0]).toBeGreaterThan(-75.7);
  });

  it("returns two coordinates when speed is zero", () => {
    const path = predictAssetPath({ ...baseAsset, speed: 0 }, []);

    expect(path.coordinates).toEqual([
      [-75.7, 45.35],
      [-75.7, 45.35],
    ]);
  });
});
