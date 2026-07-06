import type {
  GeoJSONSource,
  GeoJSONSourceSpecification,
  LineLayerSpecification,
  Map,
} from "maplibre-gl";
import type { PathGeoJson } from "@dominion-dynamics/shared";
import type { FeatureCollection, LineString } from "geojson";
import {
  MAP_LAYERS,
  PATROL_PATH_LINE_COLOR,
  PATROL_PATH_LINE_WIDTH,
} from "../../lib/constants/mapConstants.js";

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

function addPatrolPathLayerStack(
  map: Map,
  patrolPath: PathGeoJson | null,
): void {
  map.addSource(MAP_LAYERS.patrolPathSource, patrolPathSource(patrolPath));
  map.addLayer(patrolPathLineLayer);
}

/** Attach patrol path layers below assets. No-op if the source already exists. */
export function addPatrolPathLayers(
  map: Map,
  patrolPath: PathGeoJson | null,
): void {
  if (map.getSource(MAP_LAYERS.patrolPathSource)) {
    updatePatrolPathLayerData(map, patrolPath);
    return;
  }

  addPatrolPathLayerStack(map, patrolPath);
}

/** Push the latest patrol route into the existing GeoJSON source. */
export function updatePatrolPathLayerData(
  map: Map,
  patrolPath: PathGeoJson | null,
): void {
  const source = map.getSource(MAP_LAYERS.patrolPathSource) as
    | GeoJSONSource
    | undefined;

  if (!source) {
    return;
  }

  source.setData(patrolPathToFeatureCollection(patrolPath));
}

/** Re-attach patrol path layers after a basemap style swap clears custom layers. */
export function syncPatrolPathLayers(
  map: Map,
  patrolPath: PathGeoJson | null,
): void {
  if (map.getLayer(MAP_LAYERS.patrolPathLine)) {
    updatePatrolPathLayerData(map, patrolPath);
    return;
  }

  addPatrolPathLayerStack(map, patrolPath);
}
