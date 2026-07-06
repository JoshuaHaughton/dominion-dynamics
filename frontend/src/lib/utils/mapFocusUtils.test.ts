import { describe, expect, it, vi } from "vitest";
import type { LngLatBoundsLike } from "maplibre-gl";
import type { PathGeoJson } from "@dominion-dynamics/shared";
import {
  boundsFromCoordinates,
  boundsFromPatrolPath,
  easeMapToPoint,
  fitMapToBounds,
} from "./mapFocusUtils.js";

describe("easeMapToPoint", () => {
  it("pans the map center with the requested duration", () => {
    const easeTo = vi.fn();
    const map = { easeTo } as unknown as import("maplibre-gl").Map;

    easeMapToPoint(map, -75.7, 45.4, 400);

    expect(easeTo).toHaveBeenCalledWith({
      center: [-75.7, 45.4],
      duration: 400,
    });
  });
});

describe("fitMapToBounds", () => {
  it("fits the viewport with padding and duration", () => {
    const fitBounds = vi.fn();
    const map = { fitBounds } as unknown as import("maplibre-gl").Map;
    const bounds: LngLatBoundsLike = [
      [-75.8, 45.3],
      [-75.6, 45.4],
    ];

    fitMapToBounds(map, bounds, 48, 0);

    expect(fitBounds).toHaveBeenCalledWith(bounds, {
      padding: 48,
      duration: 0,
    });
  });
});

describe("boundsFromCoordinates", () => {
  it("returns null for an empty coordinate list", () => {
    expect(boundsFromCoordinates([])).toBeNull();
  });

  it("builds west/south and east/north corners from points", () => {
    expect(
      boundsFromCoordinates([
        [-75.8, 45.3],
        [-75.6, 45.4],
      ]),
    ).toEqual([
      [-75.8, 45.3],
      [-75.6, 45.4],
    ]);
  });
});

describe("boundsFromPatrolPath", () => {
  it("uses the patrol line coordinates for fitBounds", () => {
    const patrolPath: PathGeoJson = {
      type: "Feature",
      properties: { id: 1, kind: "patrol" },
      geometry: {
        type: "LineString",
        coordinates: [
          [-75.75, 45.35],
          [-75.65, 45.42],
        ],
      },
    };

    expect(boundsFromPatrolPath(patrolPath)).toEqual([
      [-75.75, 45.35],
      [-75.65, 45.42],
    ]);
  });
});
