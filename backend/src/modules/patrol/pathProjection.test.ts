import { describe, expect, it } from "vitest";
import type { PathGeoJson } from "@dominion-dynamics/shared";
import { projectOntoPatrolPath } from "./pathProjection.js";

describe("projectOntoPatrolPath", () => {
  const patrolPath: PathGeoJson = {
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

  it("returns the first waypoint when the drone is at the route start", () => {
    const projection = projectOntoPatrolPath(
      { lat: 45.3, lon: -75.8 },
      patrolPath,
    );

    expect(projection.lat).toBeCloseTo(45.3, 5);
    expect(projection.lon).toBeCloseTo(-75.8, 5);
    expect(projection.distanceM).toBeLessThan(1);
    expect(projection.segmentIndex).toBe(1);
  });

  it("snaps to the nearest point on a segment and advances the segment index", () => {
    const projection = projectOntoPatrolPath(
      { lat: 45.5, lon: -75.7 },
      patrolPath,
    );

    expect(projection.distanceM).toBeGreaterThan(1000);
    expect(projection.segmentIndex).toBeGreaterThanOrEqual(1);
  });
});
