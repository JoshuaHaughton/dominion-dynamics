import { randomUUID } from "node:crypto";
import bearing from "@turf/bearing";
import bboxPolygon from "@turf/bbox-polygon";
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import { point } from "@turf/helpers";
import type { Feature, Polygon } from "geojson";
import {
  RESPAWN_HEADING_JITTER_DEG,
  simConfig,
  SYNTHETIC_ALT_MAX_M,
  SYNTHETIC_ALT_MIN_M,
} from "./config.js";
import { sampleSyntheticSpeed } from "./speedProfiles.js";
import type { Asset, SimBounds } from "@dominion-dynamics/shared";

/** Unique id for a sim-generated track at seed or boundary respawn. */
function createSyntheticId(): string {
  return `syn-${randomUUID()}`;
}

/**
 * Convert the operating area bbox into a Turf polygon for point-in-polygon checks.
 * Turf bbox order is [minLon, minLat, maxLon, maxLat] (west, south, east, north).
 */
function toRegionPolygon(region: SimBounds): Feature<Polygon> {
  return bboxPolygon([
    region.minLon,
    region.minLat,
    region.maxLon,
    region.maxLat,
  ]);
}

/** Turf bearing is -180..180; asset heading is 0..360 clockwise from north. */
function turfBearingToHeading(bearingDeg: number): number {
  return (bearingDeg + 360) % 360;
}

// Pick a random point on one of the four seed region edges (north, south, east, west).
function randomEdgePoint(region: SimBounds): { lat: number; lon: number } {
  const edge = Math.floor(Math.random() * 4);

  switch (edge) {
    case 0:
      return {
        lat: region.maxLat,
        lon: randomInRange(region.minLon, region.maxLon),
      };
    case 1:
      return {
        lat: region.minLat,
        lon: randomInRange(region.minLon, region.maxLon),
      };
    case 2:
      return {
        lat: randomInRange(region.minLat, region.maxLat),
        lon: region.maxLon,
      };
    default:
      return {
        lat: randomInRange(region.minLat, region.maxLat),
        lon: region.minLon,
      };
  }
}

/** Whether a position lies inside the operating area bbox. */
export function isInsideSeedRegion(
  asset: Pick<Asset, "lat" | "lon">,
  region: SimBounds,
): boolean {
  return booleanPointInPolygon(
    point([asset.lon, asset.lat]),
    toRegionPolygon(region),
  );
}

function createSyntheticAsset(): Asset {
  const { seedRegion } = simConfig;

  return {
    id: createSyntheticId(),
    lat: randomInRange(seedRegion.minLat, seedRegion.maxLat),
    lon: randomInRange(seedRegion.minLon, seedRegion.maxLon),
    alt: randomInRange(SYNTHETIC_ALT_MIN_M, SYNTHETIC_ALT_MAX_M),
    heading: randomInRange(0, 360),
    speed: sampleSyntheticSpeed(),
    source: "synthetic",
  };
}

/** Create synthetic assets at random positions inside the seed region. */
export function seedAssets(count: number): Asset[] {
  return Array.from({ length: count }, () => createSyntheticAsset());
}

/**
 * Place a new track on a random boundary point with heading toward region center.
 * Assigns a fresh id and synthetic source so clients treat boundary entry as a new aircraft.
 */
export function respawnAtBoundary(asset: Asset, region: SimBounds): Asset {
  const { lat, lon } = randomEdgePoint(region);
  const centerLat = (region.minLat + region.maxLat) / 2;
  const centerLon = (region.minLon + region.maxLon) / 2;

  const towardCenter = turfBearingToHeading(
    bearing(point([lon, lat]), point([centerLon, centerLat])),
  );
  const heading =
    (towardCenter +
      randomInRange(-RESPAWN_HEADING_JITTER_DEG, RESPAWN_HEADING_JITTER_DEG) +
      360) %
    360;

  return {
    ...asset,
    id: createSyntheticId(),
    lat,
    lon,
    heading,
    source: "synthetic",
  };
}

function randomInRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}
