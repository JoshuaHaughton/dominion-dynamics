import type { GeoJSONSource, Map } from "maplibre-gl";
import type { Asset } from "@dominion-dynamics/shared";
import { MAP_LAYERS } from "../../lib/constants/mapConstants.js";
import {
  assetsToFeatureCollection,
  syncAssetLayers,
} from "./liveMapUtils.js";

/** Push live asset positions into MapLibre, creating layers when needed. */
export function pushAssetsToMap(map: Map, assets: readonly Asset[]): void {
  const source = map.getSource(MAP_LAYERS.assetsSource) as
    | GeoJSONSource
    | undefined;

  if (source) {
    source.setData(assetsToFeatureCollection(assets));
    return;
  }

  if (!map.loaded()) {
    return;
  }

  void syncAssetLayers(map, assets);
}
