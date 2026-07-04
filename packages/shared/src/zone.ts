import type { Feature, Polygon } from "geojson";

/** Restricted zone polygon stored in SQLite and rendered on the map. */
export type ZoneGeoJson = Feature<Polygon>;

export type Zone = {
  id: number;
  name: string;
  geojson: ZoneGeoJson;
};

export type CreateZoneRequest = {
  name: string;
  geojson: ZoneGeoJson;
};
