import { describe, expect, it } from "vitest";
import { ZoneListSchema, ZoneSchema } from "@dominion-dynamics/shared";

const validZone = {
  id: 1,
  name: "Zone 1",
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
} as const;

describe("ZoneSchema", () => {
  it("accepts a valid zone payload", () => {
    expect(ZoneSchema.parse(validZone)).toEqual(validZone);
  });

  it.each([
    ["non-object", "zone"],
    ["missing id", { name: "Zone 1", geojson: validZone.geojson }],
    ["missing name", { id: 1, geojson: validZone.geojson }],
    ["non-integer id", { id: 1.5, name: "Zone 1", geojson: validZone.geojson }],
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
