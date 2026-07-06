import { describe, expect, it } from "vitest";
import {
  PathGeoJsonSchema,
  PatrolPathResponseSchema,
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

  describe("PatrolPathResponseSchema", () => {
    it("accepts a saved patrol path response", () => {
      expect(PatrolPathResponseSchema.parse({ geojson: validLine })).toEqual({
        geojson: validLine,
      });
    });

    it("accepts an empty patrol path response", () => {
      expect(PatrolPathResponseSchema.parse({ geojson: null })).toEqual({
        geojson: null,
      });
    });

    it.each([
      ["non-object", "patrol-path"],
      ["missing geojson", {}],
      [
        "polygon geojson",
        {
          geojson: {
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
        },
      ],
    ])("rejects %s", (_label, payload) => {
      expect(PatrolPathResponseSchema.safeParse(payload).success).toBe(false);
    });
  });

  describe("PatrolPathSchema", () => {
    it("accepts a patrol path response", () => {
      expect(PatrolPathSchema.parse({ geojson: validLine })).toEqual({
        geojson: validLine,
      });
    });

    it("rejects an empty patrol path payload", () => {
      expect(PatrolPathSchema.safeParse({ geojson: null }).success).toBe(false);
    });
  });
});
