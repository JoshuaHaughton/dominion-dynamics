import type { Airport } from "@dominion-dynamics/shared";
import { AirportSchema } from "@dominion-dynamics/shared";
import airportsJson from "./airports.json" with { type: "json" };
import {
  buildAirportSpatialIndex,
  findNearestAirportInIndex,
  type AirportSpatialIndex,
} from "./spatialIndex.js";

type AirportRegistry = {
  readonly spatialIndex: AirportSpatialIndex;
  readonly byIdent: ReadonlyMap<string, Airport>;
};

const REGISTRY = buildRegistry();

/** Parse once at module load; build ident index for O(1) lookup. */
function buildRegistry(): AirportRegistry {
  const airports = AirportSchema.array().parse(airportsJson);
  const byIdent = new Map<string, Airport>();

  for (const airport of airports) {
    byIdent.set(airport.ident.toUpperCase(), airport);
  }

  return {
    spatialIndex: buildAirportSpatialIndex(airports),
    byIdent,
  };
}

/** O(1) lookup by ICAO / OurAirports ident. */
export function getAirportByIdent(ident: string): Airport | undefined {
  return REGISTRY.byIdent.get(ident.trim().toUpperCase());
}

/** Closest registry airport to a lat/lon (haversine via spatial index). */
export function findNearestAirport(lat: number, lon: number): Airport {
  return findNearestAirportInIndex(REGISTRY.spatialIndex, lat, lon);
}
