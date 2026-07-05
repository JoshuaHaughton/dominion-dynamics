import { describe, expect, it } from "vitest";
import {
  CreateZoneRequestSchema,
  ZoneGeoJsonSchema,
} from "@dominion-dynamics/shared";

describe("zone request schemas", () => {
  const validPolygon = {
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
  } as const;

  describe("CreateZoneRequestSchema", () => {
    it("accepts a valid zone payload and trims the name", () => {
      expect(
        CreateZoneRequestSchema.parse({
          name: "  North cap  ",
          geojson: validPolygon,
        }),
      ).toEqual({
        name: "North cap",
        geojson: validPolygon,
      });
    });

    it.each([
      ["whitespace name", { name: "  ", geojson: validPolygon }],
      ["missing name", { geojson: validPolygon }],
      ["non-object body", "zone"],
    ])("rejects %s", (_label, body) => {
      expect(CreateZoneRequestSchema.safeParse(body).success).toBe(false);
    });

    it("rejects invalid geojson", () => {
      expect(
        CreateZoneRequestSchema.safeParse({
          name: "Zone 1",
          geojson: { type: "Feature" },
        }).success,
      ).toBe(false);
    });
  });

  describe("ZoneGeoJsonSchema", () => {
    it("accepts a closed polygon feature", () => {
      expect(ZoneGeoJsonSchema.safeParse(validPolygon).success).toBe(true);
    });

    it.each([
      [
        "line string geometry",
        {
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: [
              [-75.8, 45.3],
              [-75.6, 45.45],
            ],
          },
        },
      ],
      [
        "too few ring positions",
        {
          ...validPolygon,
          geometry: {
            type: "Polygon",
            coordinates: [
              [
                [-75.8, 45.3],
                [-75.6, 45.3],
                [-75.8, 45.3],
              ],
            ],
          },
        },
      ],
      [
        "unclosed outer ring",
        {
          ...validPolygon,
          geometry: {
            type: "Polygon",
            coordinates: [
              [
                [-75.8, 45.3],
                [-75.6, 45.3],
                [-75.6, 45.45],
                [-75.8, 45.45],
              ],
            ],
          },
        },
      ],
    ])("rejects %s", (_label, geojson) => {
      expect(ZoneGeoJsonSchema.safeParse(geojson).success).toBe(false);
    });
  });
});
