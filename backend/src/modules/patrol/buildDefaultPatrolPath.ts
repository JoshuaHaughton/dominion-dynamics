import type { PathGeoJson, SimBounds } from "@dominion-dynamics/shared";

const DEFAULT_OVAL_VERTICES = 12;

/**
 * Demo patrol loop inside the operating area when no path has been saved yet.
 */
export function buildDefaultPatrolPath(region: SimBounds): PathGeoJson {
  const centerLat = (region.minLat + region.maxLat) / 2;
  const centerLon = (region.minLon + region.maxLon) / 2;
  const latRadius = (region.maxLat - region.minLat) * 0.25;
  const lonRadius = (region.maxLon - region.minLon) * 0.25;

  const coordinates: [number, number][] = [];

  for (let index = 0; index < DEFAULT_OVAL_VERTICES; index += 1) {
    const angle = (2 * Math.PI * index) / DEFAULT_OVAL_VERTICES;

    coordinates.push([
      centerLon + lonRadius * Math.cos(angle),
      centerLat + latRadius * Math.sin(angle),
    ]);
  }

  return {
    type: "Feature",
    properties: {},
    geometry: {
      type: "LineString",
      coordinates,
    },
  };
}
