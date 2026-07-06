import type { Airport } from "@dominion-dynamics/shared";
import { distanceM as geoDistanceM } from "../../lib/geo/distanceAndHeading.js";

/** Bucket size at module load; ~111 km latitude per degree of cell width. */
export const AIRPORT_GRID_CELL_DEG = 1;
/** Ring-expansion cap before falling back to a full-list scan. */
export const MAX_AIRPORT_GRID_RING = 200;

export type AirportSpatialIndex = {
  readonly airports: readonly Airport[];
  readonly grid: ReadonlyMap<string, readonly Airport[]>;
};

/** Group airports into lat/lon grid cells for nearest-neighbor ring search. */
export function buildAirportSpatialIndex(
  airports: readonly Airport[],
): AirportSpatialIndex {
  const grid = new Map<string, Airport[]>();

  for (const airport of airports) {
    const latCell = Math.floor(airport.lat / AIRPORT_GRID_CELL_DEG);
    const lonCell = Math.floor(airport.lon / AIRPORT_GRID_CELL_DEG);
    const key = `${latCell},${lonCell}`;
    const bucket = grid.get(key) ?? [];
    bucket.push(airport);
    grid.set(key, bucket);
  }

  return { airports, grid };
}

/** Haversine distance in meters; lat-first args kept for grid-math readability here. */
function haversineDistanceM(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  return geoDistanceM(lon1, lat1, lon2, lat2);
}

/**
 * Shortest distance from the query point to the edge of the square region
 * covered by rings 0..ring. If the best airport found so far is closer than
 * this, no airport in an unsearched cell can beat it.
 */
function distanceToSearchedRegionEdgeM(
  lat: number,
  lon: number,
  latCell: number,
  lonCell: number,
  ring: number,
): number {
  const minLat = (latCell - ring) * AIRPORT_GRID_CELL_DEG;
  const maxLat = (latCell + ring + 1) * AIRPORT_GRID_CELL_DEG;
  const minLon = (lonCell - ring) * AIRPORT_GRID_CELL_DEG;
  const maxLon = (lonCell + ring + 1) * AIRPORT_GRID_CELL_DEG;

  return Math.min(
    haversineDistanceM(lat, lon, minLat, lon),
    haversineDistanceM(lat, lon, maxLat, lon),
    haversineDistanceM(lat, lon, lat, minLon),
    haversineDistanceM(lat, lon, lat, maxLon),
  );
}

/** Airports in grid cells newly reached at this ring (outer shell only — inner cells were prior rings). */
function collectAirportsInRing(
  grid: ReadonlyMap<string, readonly Airport[]>,
  latCell: number,
  lonCell: number,
  ring: number,
): readonly Airport[] {
  const airports: Airport[] = [];

  for (let dLat = -ring; dLat <= ring; dLat++) {
    for (let dLon = -ring; dLon <= ring; dLon++) {
      if (Math.max(Math.abs(dLat), Math.abs(dLon)) !== ring) {
        continue;
      }

      const bucket = grid.get(`${latCell + dLat},${lonCell + dLon}`);
      if (bucket) {
        airports.push(...bucket);
      }
    }
  }

  return airports;
}

/** Last-resort scan when ring expansion exhausts MAX_AIRPORT_GRID_RING. */
function findNearestAirportBruteForceInList(
  airports: readonly Airport[],
  lat: number,
  lon: number,
): Airport {
  let nearest: Airport | undefined;
  let nearestDistanceM = Infinity;

  for (const candidate of airports) {
    const candidateDistanceM = haversineDistanceM(
      lat,
      lon,
      candidate.lat,
      candidate.lon,
    );

    if (candidateDistanceM < nearestDistanceM) {
      nearest = candidate;
      nearestDistanceM = candidateDistanceM;
    }
  }

  if (!nearest) {
    throw new Error("Airport list is empty");
  }

  return nearest;
}

/**
 * Closest airport in an index (haversine).
 * Expands grid rings outward; empty ocean/desert cells are skipped cheaply until
 * the nearest candidate is closer than the next unsearched band.
 */
export function findNearestAirportInIndex(
  index: AirportSpatialIndex,
  lat: number,
  lon: number,
): Airport {
  const { airports, grid } = index;

  if (airports.length === 0) {
    throw new Error("Airport list is empty");
  }

  const latCell = Math.floor(lat / AIRPORT_GRID_CELL_DEG);
  const lonCell = Math.floor(lon / AIRPORT_GRID_CELL_DEG);

  let nearest: Airport | null = null;
  let nearestDistanceM = Number.POSITIVE_INFINITY;

  for (let ring = 0; ring <= MAX_AIRPORT_GRID_RING; ring++) {
    for (const candidate of collectAirportsInRing(
      grid,
      latCell,
      lonCell,
      ring,
    )) {
      const distanceM = haversineDistanceM(
        lat,
        lon,
        candidate.lat,
        candidate.lon,
      );

      if (distanceM < nearestDistanceM) {
        nearest = candidate;
        nearestDistanceM = distanceM;
      }
    }

    if (nearest !== null) {
      const edgeDistanceM = distanceToSearchedRegionEdgeM(
        lat,
        lon,
        latCell,
        lonCell,
        ring,
      );

      // No unsearched cell can contain a closer airport — safe to return.
      if (nearestDistanceM <= edgeDistanceM) {
        return nearest;
      }
    }
  }

  return findNearestAirportBruteForceInList(airports, lat, lon);
}
