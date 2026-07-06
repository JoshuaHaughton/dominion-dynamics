import type { Feature, Polygon } from "geojson";
import { describe, expect, it } from "vitest";
import type { AssetHistoryPoint } from "@dominion-dynamics/shared";
import { testAsset } from "@dominion-dynamics/shared/testing";
import { evaluateZoneThreat } from "../zone/evaluateAsset.js";
import { predictAssetPath } from "./predictPath.js";
import { toCachedZone } from "../zone/zoneGeometryCache.js";

describe("asset track helpers", () => {
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

  describe("evaluateZoneThreat nearestBoundaryM", () => {
    it("returns 0 when the asset is inside a zone", () => {
      const inside = { ...baseAsset, lat: 45.4, lon: -75.7 };

      expect(
        evaluateZoneThreat(inside, [
          toCachedZone({
            id: 1,
            name: "Z1",
            geojson: zonePolygon,
          }),
        ]).nearestBoundaryM,
      ).toBe(0);
    });

    it("returns a positive distance when outside", () => {
      const outside = { ...baseAsset, lat: 45.25, lon: -75.7 };
      const nearestBoundaryM = evaluateZoneThreat(outside, [
        toCachedZone({ id: 1, name: "Z1", geojson: zonePolygon }),
      ]).nearestBoundaryM;

      expect(nearestBoundaryM).not.toBeNull();
      expect(nearestBoundaryM!).toBeGreaterThan(0);
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

    it("uses instantaneous heading and speed for drones", () => {
      const droneAsset = testAsset({
        id: "patrol-1",
        role: "drone",
        lat: 45.35,
        lon: -75.7,
        alt: 500,
        heading: 180,
        speed: 80,
        zone: null,
        drone: {
          origin: "patrol",
          patrol: { mode: "patrol", shadowTargetId: null },
        },
      });
      const history: AssetHistoryPoint[] = [
        { lat: 45.35, lon: -75.75, ts: 0 },
        { lat: 45.35, lon: -75.7, ts: 60_000 },
      ];

      const path = predictAssetPath(droneAsset, history);

      expect(path.coordinates[0]).toEqual([-75.7, 45.35]);
      expect(path.coordinates[1]?.[1]).toBeLessThan(45.35);
      expect(path.coordinates[1]?.[0]).toBeCloseTo(-75.7, 4);
    });

    it("draws the prediction line to the chased asset while shadowing", () => {
      const droneAsset = testAsset({
        id: "patrol-1",
        role: "drone",
        lat: 45.35,
        lon: -75.7,
        alt: 500,
        heading: 90,
        speed: 80,
        zone: null,
        drone: {
          origin: "patrol",
          patrol: { mode: "shadow", shadowTargetId: "target-1" },
        },
      });

      const path = predictAssetPath(droneAsset, [], {
        lineEnd: { lat: 45.35, lon: -75.5 },
      });

      expect(path.coordinates).toEqual([
        [-75.7, 45.35],
        [-75.5, 45.35],
      ]);
    });

    it("draws the prediction line to the rejoin snap point while rejoining", () => {
      const droneAsset = testAsset({
        id: "patrol-1",
        role: "drone",
        lat: 45.35,
        lon: -75.7,
        alt: 500,
        heading: 90,
        speed: 300,
        zone: null,
        drone: {
          origin: "patrol",
          patrol: { mode: "rejoin", shadowTargetId: null },
        },
      });

      const path = predictAssetPath(droneAsset, [], {
        lineEnd: { lat: 45.36, lon: -75.65 },
      });

      expect(path.coordinates).toEqual([
        [-75.7, 45.35],
        [-75.65, 45.36],
      ]);
    });
  });
});
