import { describe, expect, it } from "vitest";
import {
  CreateZoneRequestSchema,
  ZoneGeoJsonSchema,
  ZoneListSchema,
  ZoneSchema,
} from "./schema.js";

describe("zone schemas", () => {
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
      [
        "polygon with holes",
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
                [-75.8, 45.3],
              ],
              [
                [-75.75, 45.35],
                [-75.65, 45.35],
                [-75.65, 45.4],
                [-75.75, 45.4],
                [-75.75, 45.35],
              ],
            ],
          },
        },
      ],
    ])("rejects %s", (_label, geojson) => {
      expect(ZoneGeoJsonSchema.safeParse(geojson).success).toBe(false);
    });
  });

  describe("ZoneSchema", () => {
    const validZone = {
      id: 1,
      name: "Zone 1",
      geojson: validPolygon,
    };

    it("accepts a valid zone payload", () => {
      expect(ZoneSchema.parse(validZone)).toEqual(validZone);
    });

    it.each([
      ["non-object", "zone"],
      ["missing id", { name: "Zone 1", geojson: validPolygon }],
      ["missing name", { id: 1, geojson: validPolygon }],
      ["non-integer id", { id: 1.5, name: "Zone 1", geojson: validPolygon }],
      [
        "non-polygon geojson",
        {
          id: 1,
          name: "Zone 1",
          geojson: {
            type: "Feature",
            properties: {},
            geometry: { type: "Point", coordinates: [0, 0] },
          },
        },
      ],
    ])("rejects %s", (_label, payload) => {
      expect(ZoneSchema.safeParse(payload).success).toBe(false);
    });
  });

  describe("ZoneListSchema", () => {
    const validZone = {
      id: 1,
      name: "Zone 1",
      geojson: validPolygon,
    };

    it("accepts a valid zone list", () => {
      expect(ZoneListSchema.parse([validZone])).toEqual([validZone]);
    });

    it("rejects malformed lists", () => {
      expect(ZoneListSchema.safeParse("zones").success).toBe(false);
      expect(
        ZoneListSchema.safeParse([
          validZone,
          { id: "bad", name: "Zone 2", geojson: validZone.geojson },
        ]).success,
      ).toBe(false);
    });
  });
});
