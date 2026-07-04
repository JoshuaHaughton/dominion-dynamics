import { describe, expect, it } from "vitest";
import { parseZone, parseZones } from "./parseZone.js";

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

describe("parseZone", () => {
  it("accepts a valid zone payload", () => {
    expect(parseZone(validZone)).toEqual(validZone);
  });

  it.each([
    ["non-object", "zone"],
    ["missing id", { name: "Zone 1", geojson: validZone.geojson }],
    ["missing name", { id: 1, geojson: validZone.geojson }],
    ["non-integer id", { id: 1.5, name: "Zone 1", geojson: validZone.geojson }],
    ["non-polygon geojson", { id: 1, name: "Zone 1", geojson: { type: "Feature", properties: {}, geometry: { type: "Point", coordinates: [0, 0] } } }],
  ])("rejects %s", (_label, payload) => {
    expect(parseZone(payload)).toBeNull();
  });
});

describe("parseZones", () => {
  it("accepts a valid zone list", () => {
    expect(parseZones([validZone])).toEqual([validZone]);
  });

  it("rejects malformed lists", () => {
    expect(parseZones("zones")).toBeNull();
    expect(parseZones([validZone, { id: "bad", name: "Zone 2", geojson: validZone.geojson }])).toBeNull();
  });
});
