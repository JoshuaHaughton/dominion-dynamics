import type {
  GeoJSONSourceSpecification,
  LineLayerSpecification,
  Map,
} from "maplibre-gl";
import type { PathGeoJson } from "@dominion-dynamics/shared";
import type { FeatureCollection, LineString } from "geojson";
import {
  syncGeoJsonLayers,
  updateGeoJsonSource,
  type GeoJsonLayerConfig,
} from "../map/geoJsonLayerLifecycle.js";
import {
  MAP_LAYERS,
  PATROL_PATH_LINE_COLOR,
  PATROL_PATH_LINE_WIDTH,
} from "../../../lib/constants/mapConstants.js";

/** Convert the saved patrol route into a GeoJSON FeatureCollection for MapLibre. */
export function patrolPathToFeatureCollection(
  patrolPath: PathGeoJson | null,
): FeatureCollection<LineString> {
  if (patrolPath === null) {
    return {
      type: "FeatureCollection",
      features: [],
    };
  }

  return {
    type: "FeatureCollection",
    features: [
      {
        ...patrolPath,
        id: "patrol-path",
        properties: {
          ...patrolPath.properties,
          id: "patrol-path",
        },
      },
    ],
  };
}

const patrolPathSource = (
  patrolPath: PathGeoJson | null,
): GeoJSONSourceSpecification => ({
  type: "geojson",
  data: patrolPathToFeatureCollection(patrolPath),
  promoteId: "id",
});

const patrolPathLineLayer: LineLayerSpecification = {
  id: MAP_LAYERS.patrolPathLine,
  type: "line",
  source: MAP_LAYERS.patrolPathSource,
  paint: {
    "line-color": PATROL_PATH_LINE_COLOR,
    "line-width": PATROL_PATH_LINE_WIDTH,
  },
};

/**
 * MapLibre draw order: layers added later render on top.
 * `beforeId` inserts this layer *under* the named layer (see Map.addLayer docs).
 */
function patrolPathLayerBeforeId(map: Map): string | undefined {
  if (map.getLayer(MAP_LAYERS.assetsCircles)) {
    return MAP_LAYERS.assetsCircles;
  }

  return map.getLayer(MAP_LAYERS.assetsMarkers)
    ? MAP_LAYERS.assetsMarkers
    : undefined;
}

const patrolPathLayerConfig: GeoJsonLayerConfig<PathGeoJson | null> = {
  sourceId: MAP_LAYERS.patrolPathSource,
  primaryLayerId: MAP_LAYERS.patrolPathLine,
  toFeatureCollection: patrolPathToFeatureCollection,
  addLayerStack: (map, patrolPath) => {
    map.addSource(MAP_LAYERS.patrolPathSource, patrolPathSource(patrolPath));

    const beforeId = patrolPathLayerBeforeId(map);

    if (beforeId) {
      // Route line sits under traffic/drone markers when asset layers already exist.
      map.addLayer(patrolPathLineLayer, beforeId);
      return;
    }

    map.addLayer(patrolPathLineLayer);
  },
};

/** Push the latest patrol route into the existing GeoJSON source. */
export function updatePatrolPathLayerData(
  map: Map,
  patrolPath: PathGeoJson | null,
): void {
  updateGeoJsonSource(map, patrolPathLayerConfig, patrolPath);
}

/** Re-attach patrol path layers after a basemap style swap clears custom layers. */
export function syncPatrolPathLayers(
  map: Map,
  patrolPath: PathGeoJson | null,
): void {
  syncGeoJsonLayers(map, patrolPathLayerConfig, patrolPath);
}
