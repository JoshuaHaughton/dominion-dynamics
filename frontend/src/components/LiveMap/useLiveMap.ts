import maplibregl, { type Map } from "maplibre-gl";
import type { Asset } from "@dominion-dynamics/shared";
import { useEffect, useRef, type RefObject } from "react";
import {
  DEMO_SEED_REGION,
  INITIAL_MAP_ZOOM,
  MAP_FIT_PADDING,
  MAP_STYLE_URL,
} from "../../lib/constants/mapConstants.js";
import { getRegionCenter, toFitBounds } from "../../lib/utils/mapUtils.js";
import { addAssetLayers, updateAssetLayerData } from "./liveMapUtils.js";

type UseLiveMapResult = {
  containerRef: RefObject<HTMLDivElement | null>;
};

/** Manage MapLibre lifecycle and sync asset snapshots onto the map. */
export function useLiveMap(assets: readonly Asset[]): UseLiveMapResult {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const hasFitBoundsRef = useRef(false);
  // load runs once; assets may still be empty. Effect below syncs when they arrive.
  const assetsRef = useRef(assets);
  assetsRef.current = assets;

  // Create the map once. MapLibre owns the canvas and must be torn down on unmount.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) {
      return;
    }

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE_URL,
      center: getRegionCenter(DEMO_SEED_REGION),
      zoom: INITIAL_MAP_ZOOM,
    });

    map.addControl(new maplibregl.NavigationControl(), "top-right");

    map.on("load", () => {
      addAssetLayers(map, assetsRef.current);
      fitDemoRegionIfNeeded(map, assetsRef.current.length);
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      hasFitBoundsRef.current = false;
    };
  }, []);

  // Apply each WebSocket snapshot without recreating the map.
  useEffect(() => {
    const map = mapRef.current;

    // Source/layer are only available after the style finishes loading.
    if (!map?.isStyleLoaded()) {
      return;
    }

    updateAssetLayerData(map, assets);
    fitDemoRegionIfNeeded(map, assets.length);
  }, [assets]);

  /** Fit to the demo AOI once, when the first snapshot has at least one asset. */
  function fitDemoRegionIfNeeded(map: Map, assetCount: number): void {
    if (hasFitBoundsRef.current || assetCount === 0) {
      return;
    }

    map.fitBounds(toFitBounds(DEMO_SEED_REGION), {
      padding: MAP_FIT_PADDING,
      duration: 0,
    });
    hasFitBoundsRef.current = true;
  }

  return { containerRef };
}
