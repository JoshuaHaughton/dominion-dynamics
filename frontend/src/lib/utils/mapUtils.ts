import type { LngLatBoundsLike, LngLatLike } from "maplibre-gl";
import type { SimBounds } from "@dominion-dynamics/shared";

/** Longitude/latitude center of a geographic rectangle. */
export function getRegionCenter(region: SimBounds): LngLatLike {
  return [
    (region.minLon + region.maxLon) / 2,
    (region.minLat + region.maxLat) / 2,
  ];
}

/**
 * MapLibre fitBounds corners from SimBounds.
 * Uses west/south and east/north pairs in GeoJSON lon/lat order.
 */
export function toFitBounds(region: SimBounds): LngLatBoundsLike {
  return [
    [region.minLon, region.minLat],
    [region.maxLon, region.maxLat],
  ];
}
