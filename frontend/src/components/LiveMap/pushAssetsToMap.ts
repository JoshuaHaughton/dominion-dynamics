import type { GeoJSONSource, Map } from "maplibre-gl";
import type { Asset } from "@dominion-dynamics/shared";
import type { MapVisualFilter } from "../../lib/utils/assetSymbology.js";
import { MAP_LAYERS } from "../../lib/constants/mapConstants.js";
import {
  assetsToFeatureCollection,
  syncAssetLayers,
} from "./liveMapUtils.js";

type PushAssetsToMapInput = {
  map: Map;
  assets: readonly Asset[];
  visualFilter?: MapVisualFilter;
};

/** Push live asset positions into MapLibre, creating layers when needed. */
export function pushAssetsToMap({
  map,
  assets,
  visualFilter,
}: PushAssetsToMapInput): void {
  const source = map.getSource(MAP_LAYERS.assetsSource) as
    | GeoJSONSource
    | undefined;

  if (source) {
    source.setData(assetsToFeatureCollection(assets, visualFilter));
    return;
  }

  if (!map.loaded()) {
    return;
  }

  void syncAssetLayers(map, assets, visualFilter);
}
