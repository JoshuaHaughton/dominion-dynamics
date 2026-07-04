import maplibregl, { type Map } from "maplibre-gl";
import type { Asset } from "@dominion-dynamics/shared";
import type { MapStyleId } from "../../lib/constants/mapStyles.js";
import { useEffect, useRef, type RefObject } from "react";
import {
  DEMO_SEED_REGION,
  INITIAL_MAP_ZOOM,
  MAP_FIT_PADDING,
} from "../../lib/constants/mapConstants.js";
import { getMapStyleUrl } from "../../lib/constants/mapStyles.js";
import { getRegionCenter, toFitBounds } from "../../lib/utils/mapUtils.js";
import { syncAssetLayers, updateAssetLayerData } from "./liveMapUtils.js";

export type LiveMapInput = {
  assets: readonly Asset[];
  styleId: MapStyleId;
};

type UseLiveMapResult = {
  containerRef: RefObject<HTMLDivElement | null>;
};

/** Manage MapLibre lifecycle and sync asset snapshots onto the map. */
export function useLiveMap({
  assets,
  styleId,
}: LiveMapInput): UseLiveMapResult {
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
      style: getMapStyleUrl(styleId),
      center: getRegionCenter(DEMO_SEED_REGION),
      zoom: INITIAL_MAP_ZOOM,
    });

    map.addControl(new maplibregl.NavigationControl(), "top-right");

    map.on("load", () => {
      void syncAssetLayers(map, assetsRef.current).then(() => {
        fitDemoRegionIfNeeded(map, assetsRef.current.length);
      });
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      hasFitBoundsRef.current = false;
    };
  }, []);

  // Swap basemap when the user picks a different style.
  const skipNextStyleSwapRef = useRef(true);

  useEffect(() => {
    const map = mapRef.current;

    if (!map) return;

    if (skipNextStyleSwapRef.current) {
      skipNextStyleSwapRef.current = false;
      return;
    }

    map.setStyle(getMapStyleUrl(styleId));

    const onStyleLoad = () => {
      void syncAssetLayers(map, assetsRef.current).then(() => {
        fitDemoRegionIfNeeded(map, assetsRef.current.length);
      });
    };

    map.once("style.load", onStyleLoad);

    return () => {
      map.off("style.load", onStyleLoad);
    };
  }, [styleId]);

  // Apply each WebSocket snapshot without recreating the map.
  useEffect(() => {
    const map = mapRef.current;

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
