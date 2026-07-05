import { describe, expect, it } from "vitest";
import {
  isValidZoneGeoJson,
  validateCreateZoneBody,
} from "./validateZoneGeojson.js";

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

describe("validateCreateZoneBody", () => {
  it("accepts a valid zone payload and trims the name", () => {
    expect(
      validateCreateZoneBody({ name: "  North cap  ", geojson: validPolygon }),
    ).toEqual({
      ok: true,
      value: { name: "North cap", geojson: validPolygon },
    });
  });

  it.each([
    ["whitespace name", { name: "  ", geojson: validPolygon }],
    ["missing name", { geojson: validPolygon }],
    ["non-object body", "zone"],
  ])("rejects %s", (_label, body) => {
    expect(validateCreateZoneBody(body).ok).toBe(false);
  });

  it("rejects invalid geojson", () => {
    expect(
      validateCreateZoneBody({ name: "Zone 1", geojson: { type: "Feature" } })
        .ok,
    ).toBe(false);
  });
});

describe("isValidZoneGeoJson", () => {
  it("accepts a closed polygon feature", () => {
    expect(isValidZoneGeoJson(validPolygon)).toBe(true);
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
    expect(isValidZoneGeoJson(geojson)).toBe(false);
  });
});
