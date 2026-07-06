import { describe, expect, it } from "vitest";
import type { Airport } from "@dominion-dynamics/shared";
import {
  buildAirportSpatialIndex,
  findNearestAirportInIndex,
} from "./spatialIndex.js";

function airport(
  ident: string,
  lat: number,
  lon: number,
): Airport {
  return { ident, name: ident, lat, lon };
}

describe("airport spatial index", () => {
  const ottawaFixture = [
    airport("CYOW", 45.3225, -75.6692),
    airport("CYRO", 45.4215, -75.6972),
    airport("FAR", 50.0, -80.0),
  ];

  it("returns the closest airport in a small fixture", () => {
    const index = buildAirportSpatialIndex(ottawaFixture);

    expect(findNearestAirportInIndex(index, 45.3225, -75.6692).ident).toBe(
      "CYOW",
    );
    expect(findNearestAirportInIndex(index, 45.4215, -75.6972).ident).toBe(
      "CYRO",
    );
  });

  it("expands outward when the query cell has no airports", () => {
    const index = buildAirportSpatialIndex([
      airport("NEAR", 45.35, -75.65),
      airport("FAR", 48.0, -70.0),
    ]);

    expect(findNearestAirportInIndex(index, 45.34, -75.66).ident).toBe("NEAR");
  });

  it("finds the nearest airport across sparse cells", () => {
    const index = buildAirportSpatialIndex([
      airport("WEST", 0.5, -10.5),
      airport("EAST", 0.5, 9.5),
    ]);

    expect(findNearestAirportInIndex(index, 0.1, 0.1).ident).toBe("EAST");
  });
});
