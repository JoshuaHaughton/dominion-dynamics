import { describe, expect, it } from "vitest";
import {
  PathGeoJsonSchema,
  PatrolPathSchema,
  SavePatrolPathRequestSchema,
} from "./path.js";

describe("patrol path schemas", () => {
  const validLine = {
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
  } as const;

  describe("PathGeoJsonSchema", () => {
    it("accepts a line string feature with at least two vertices", () => {
      expect(PathGeoJsonSchema.safeParse(validLine).success).toBe(true);
    });

    it.each([
      [
        "polygon geometry",
        {
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
        },
      ],
      [
        "single coordinate",
        {
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: [[-75.8, 45.3]],
          },
        },
      ],
    ])("rejects %s", (_label, geojson) => {
      expect(PathGeoJsonSchema.safeParse(geojson).success).toBe(false);
    });
  });

  describe("SavePatrolPathRequestSchema", () => {
    it("accepts a patrol path payload", () => {
      expect(
        SavePatrolPathRequestSchema.parse({ geojson: validLine }),
      ).toEqual({ geojson: validLine });
    });
  });

  describe("PatrolPathSchema", () => {
    it("accepts a patrol path response", () => {
      expect(PatrolPathSchema.parse({ geojson: validLine })).toEqual({
        geojson: validLine,
      });
    });
  });
});
