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
} from "./geoJsonLayerLifecycle.js";
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

const patrolPathLayerConfig: GeoJsonLayerConfig<PathGeoJson | null> = {
  sourceId: MAP_LAYERS.patrolPathSource,
  primaryLayerId: MAP_LAYERS.patrolPathLine,
  toFeatureCollection: patrolPathToFeatureCollection,
  addLayerStack: (map, patrolPath) => {
    map.addSource(MAP_LAYERS.patrolPathSource, patrolPathSource(patrolPath));
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
  ensurePatrolPathBelowAssetLayers(map);
}

/** Keep the route line under traffic circles and drone markers. */
export function ensurePatrolPathBelowAssetLayers(map: Map): void {
  if (!map.getLayer(MAP_LAYERS.patrolPathLine)) {
    return;
  }

  if (!map.getLayer(MAP_LAYERS.assetsCircles)) {
    return;
  }

  map.moveLayer(MAP_LAYERS.patrolPathLine, MAP_LAYERS.assetsCircles);
}
