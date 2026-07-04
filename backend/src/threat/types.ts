import type { Feature, Polygon } from "geojson";

/** Turf-ready zone geometry kept in memory so ticks skip DB reads and GeoJSON parsing. */
export type CachedZone = {
  id: number;
  name: string;
  polygon: Feature<Polygon>;
  /** Axis-aligned bounds as [minLon, minLat, maxLon, maxLat]. */
  bbox: [number, number, number, number];
};
