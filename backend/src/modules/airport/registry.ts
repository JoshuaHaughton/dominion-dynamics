import type { Airport } from "@dominion-dynamics/shared";
import { AirportSchema } from "@dominion-dynamics/shared";
import airportsJson from "./airports.json" with { type: "json" };

const EARTH_RADIUS_M = 6_371_000;

type AirportRegistry = {
  readonly airports: readonly Airport[];
  readonly byIdent: ReadonlyMap<string, Airport>;
};

/** Parse once at module load; build ident index for O(1) lookup. */
function buildRegistry(): AirportRegistry {
  const airports = AirportSchema.array().parse(airportsJson);
  const byIdent = new Map<string, Airport>();

  for (const airport of airports) {
    byIdent.set(airport.ident.toUpperCase(), airport);
  }

  return { airports, byIdent };
}

const REGISTRY = buildRegistry();

function haversineDistanceM(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(a));
}

/** O(1) lookup by ICAO / OurAirports ident. */
export function getAirportByIdent(ident: string): Airport | undefined {
  return REGISTRY.byIdent.get(ident.trim().toUpperCase());
}

/**
 * Closest registry airport to a lat/lon (haversine).
 * O(n) over ~48k airfields — run on dispatch events, not every sim tick per asset.
 */
export function findNearestAirport(lat: number, lon: number): Airport {
  const { airports } = REGISTRY;

  if (airports.length === 0) {
    throw new Error("Airport registry is empty");
  }

  let nearest = airports[0]!;
  let nearestDistanceM = haversineDistanceM(lat, lon, nearest.lat, nearest.lon);

  for (let index = 1; index < airports.length; index++) {
    const candidate = airports[index]!;
    const distanceM = haversineDistanceM(lat, lon, candidate.lat, candidate.lon);

    if (distanceM < nearestDistanceM) {
      nearest = candidate;
      nearestDistanceM = distanceM;
    }
  }

  return nearest;
}
