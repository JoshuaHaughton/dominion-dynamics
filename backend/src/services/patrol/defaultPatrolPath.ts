import type { PathGeoJson } from "@dominion-dynamics/shared";

/** Ottawa demo patrol oval centered near CYOW / the default map focus region. */
const OVAL_CENTER_LON = -75.67;
const OVAL_CENTER_LAT = 45.37;
const OVAL_RADIUS_LON = 0.065;
const OVAL_RADIUS_LAT = 0.045;
const OVAL_VERTICES = 36;

function buildOvalCoordinates(): [number, number][] {
  const coordinates: [number, number][] = [];

  for (let index = 0; index < OVAL_VERTICES; index += 1) {
    const angle = (index / OVAL_VERTICES) * Math.PI * 2;

    coordinates.push([
      OVAL_CENTER_LON + Math.cos(angle) * OVAL_RADIUS_LON,
      OVAL_CENTER_LAT + Math.sin(angle) * OVAL_RADIUS_LAT,
    ]);
  }

  const first = coordinates[0];

  // Close the loop on the first vertex (OVAL_VERTICES > 0 guarantees it exists).
  if (first) {
    coordinates.push(first);
  }

  return coordinates;
}

/** Default closed patrol loop seeded when no route exists in SQLite. */
export const DEFAULT_PATROL_PATH_GEOJSON: PathGeoJson = {
  type: "Feature",
  properties: { seeded: true },
  geometry: {
    type: "LineString",
    coordinates: buildOvalCoordinates(),
  },
};
