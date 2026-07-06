import { describe, expect, it } from "vitest";
import type { PathGeoJson } from "@dominion-dynamics/shared";
import { patrolPathToFeatureCollection } from "./patrolPathMapUtils.js";

describe("patrolPathToFeatureCollection", () => {
  const savedPath: PathGeoJson = {
    type: "Feature",
    properties: {},
    geometry: {
      type: "LineString",
      coordinates: [
        [-75.8, 45.3],
        [-75.6, 45.35],
        [-75.5, 45.45],
      ],
    },
  };

  it("returns an empty collection when no patrol path is saved", () => {
    expect(patrolPathToFeatureCollection(null)).toEqual({
      type: "FeatureCollection",
      features: [],
    });
  });

  it("maps a saved patrol route to a line feature", () => {
    const collection = patrolPathToFeatureCollection(savedPath);

    expect(collection.features).toHaveLength(1);
    expect(collection.features[0]?.id).toBe("patrol-path");
    expect(collection.features[0]?.geometry).toEqual(savedPath.geometry);
    expect(collection.features[0]?.properties).toEqual({ id: "patrol-path" });
  });
});
