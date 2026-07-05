import { describe, expect, it } from "vitest";
import type { PathGeoJson } from "@dominion-dynamics/shared";
import { isClosedPatrolPath, patrolPathSegmentCount } from "./pathGeometry.js";

describe("pathGeometry", () => {
  const openPath: PathGeoJson = {
    type: "Feature",
    properties: {},
    geometry: {
      type: "LineString",
      coordinates: [
        [-75.8, 45.3],
        [-75.7, 45.35],
        [-75.6, 45.4],
      ],
    },
  };

  const closedPath: PathGeoJson = {
    type: "Feature",
    properties: {},
    geometry: {
      type: "LineString",
      coordinates: [
        [-75.8, 45.3],
        [-75.7, 45.35],
        [-75.6, 45.4],
        [-75.8, 45.3],
      ],
    },
  };

  it("treats duplicate first/last vertices as a closed route", () => {
    expect(isClosedPatrolPath(closedPath)).toBe(true);
    expect(patrolPathSegmentCount(closedPath)).toBe(4);
  });

  it("treats distinct endpoints as an open route", () => {
    expect(isClosedPatrolPath(openPath)).toBe(false);
    expect(patrolPathSegmentCount(openPath)).toBe(2);
  });
});
