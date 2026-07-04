import type {
  CircleLayerSpecification,
  GeoJSONSource,
  GeoJSONSourceSpecification,
  Map,
} from "maplibre-gl";
import type { FeatureCollection, Point } from "geojson";
import type { Asset } from "@dominion-dynamics/shared";
import {
  ASSET_SOURCE_COLORS,
  MAP_LAYERS,
} from "../../lib/constants/mapConstants.js";

/** Convert live assets into a GeoJSON FeatureCollection for MapLibre. */
export function assetsToFeatureCollection(
  assets: readonly Asset[],
): FeatureCollection<Point> {
  return {
    type: "FeatureCollection",
    features: assets.map((asset) => ({
      type: "Feature",
      id: asset.id,
      geometry: {
        type: "Point",
        coordinates: [asset.lon, asset.lat],
      },
      properties: {
        id: asset.id,
        source: asset.source,
      },
    })),
  };
}

/** GeoJSON source spec for live asset points. promoteId keeps feature ids stable on updates. */
const assetsSource = (
  assets: readonly Asset[],
): GeoJSONSourceSpecification => ({
  type: "geojson",
  data: assetsToFeatureCollection(assets),
  promoteId: "id",
});

/** Circle layer for assets. Color reads feature.properties.source via a MapLibre match expression. */
const assetsCircleLayer: CircleLayerSpecification = {
  id: MAP_LAYERS.assetsCircles,
  type: "circle",
  source: MAP_LAYERS.assetsSource,
  paint: {
    "circle-radius": 5,
    // match is like: source === "opensky" ? opensky : synthetic (last value is the default)
    "circle-color": [
      "match",
      ["get", "source"],
      "opensky",
      ASSET_SOURCE_COLORS.opensky,
      ASSET_SOURCE_COLORS.synthetic,
    ],
    "circle-stroke-width": 1,
    "circle-stroke-color": ASSET_SOURCE_COLORS.stroke,
  },
};

/** Attach the asset GeoJSON source and circle layer. Call once after map load. */
export function addAssetLayers(map: Map, assets: readonly Asset[]): void {
  map.addSource(MAP_LAYERS.assetsSource, assetsSource(assets));
  map.addLayer(assetsCircleLayer);
}

/** Push the latest asset snapshot into the existing GeoJSON source. */
export function updateAssetLayerData(map: Map, assets: readonly Asset[]): void {
  const source = map.getSource(MAP_LAYERS.assetsSource) as
    | GeoJSONSource
    | undefined;

  if (!source) {
    return;
  }

  source.setData(assetsToFeatureCollection(assets));
}
