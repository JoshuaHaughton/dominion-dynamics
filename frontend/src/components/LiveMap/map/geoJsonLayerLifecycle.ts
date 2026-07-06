import type { GeoJSONSource, Map as MapLibreMap } from "maplibre-gl";
import type { FeatureCollection } from "geojson";

/** Runtime-checked narrowing instead of a blind `as GeoJSONSource` cast. */
export function getGeoJsonSource(
  map: MapLibreMap,
  id: string,
): GeoJSONSource | undefined {
  const source = map.getSource(id);

  return source?.type === "geojson" ? (source as GeoJSONSource) : undefined;
}

/** Push a feature collection into an existing GeoJSON source; no-op when absent. */
export function setGeoJsonData(
  map: MapLibreMap,
  sourceId: string,
  collection: FeatureCollection,
): void {
  getGeoJsonSource(map, sourceId)?.setData(collection);
}

export type GeoJsonLayerConfig<T> = {
  sourceId: string;
  /** Layer whose presence proves the stack survived the last style swap. */
  primaryLayerId: string;
  toFeatureCollection: (data: T) => FeatureCollection;
  /** Adds the source plus every layer in draw order. */
  addLayerStack: (map: MapLibreMap, data: T) => void;
};

/** Update the source data in place; no-op when the source is missing. */
export function updateGeoJsonSource<T>(
  map: MapLibreMap,
  config: GeoJsonLayerConfig<T>,
  data: T,
): void {
  setGeoJsonData(map, config.sourceId, config.toFeatureCollection(data));
}

/** Update when the layer stack exists, otherwise (re)attach it — e.g. after a style swap. */
export function syncGeoJsonLayers<T>(
  map: MapLibreMap,
  config: GeoJsonLayerConfig<T>,
  data: T,
): void {
  if (map.getLayer(config.primaryLayerId)) {
    updateGeoJsonSource(map, config, data);
    return;
  }

  config.addLayerStack(map, data);
}
