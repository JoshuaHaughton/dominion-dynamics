import maplibregl, { type Map as MapLibreMap } from "maplibre-gl";
import { useEffect, useRef, type RefObject } from "react";
import type { MapStyleId } from "../../../lib/constants/mapStyles.js";
import { getMapStyleUrl } from "../../../lib/constants/mapStyles.js";
import {
  DEMO_MAP_FOCUS_REGION,
  INITIAL_MAP_ZOOM,
} from "../../../lib/constants/mapConstants.js";
import { getRegionCenter } from "../map/mapUtils.js";
import { transformCustomMapStyle } from "../map/mapStyleTransform.js";

type UseMapInstanceInput = {
  /** Owned by the orchestrator so sibling hooks can share them. */
  containerRef: RefObject<HTMLDivElement | null>;
  mapRef: RefObject<MapLibreMap | null>;
  styleId: MapStyleId;
  /** Initial content sync once the map (or a swapped style) has loaded. */
  syncMapContent: (map: MapLibreMap) => void;
  /** Cleanup that must run before map.remove() (draw control detach etc). */
  onTeardown: (map: MapLibreMap) => void;
};

/** Create/destroy the MapLibre map and re-sync content after basemap swaps. */
export function useMapInstance({
  containerRef,
  mapRef,
  styleId,
  syncMapContent,
  onTeardown,
}: UseMapInstanceInput): void {
  const skipNextStyleSwapRef = useRef(true);
  const callbacksRef = useRef({ syncMapContent, onTeardown });
  // The map is created exactly once; later styleId changes go through the
  // swap effect below instead of recreating the map.
  const initialStyleIdRef = useRef(styleId);

  useEffect(() => {
    callbacksRef.current = { syncMapContent, onTeardown };
  });

  /** Create the map once, attach controls, and tear down on unmount. */
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: getMapStyleUrl(initialStyleIdRef.current),
      center: getRegionCenter(DEMO_MAP_FOCUS_REGION),
      zoom: INITIAL_MAP_ZOOM,
      // Private demo build; no on-map tile attribution chrome.
      attributionControl: false,
    });

    map.addControl(new maplibregl.NavigationControl(), "bottom-left");

    map.on("load", () => {
      callbacksRef.current.syncMapContent(map);
    });

    mapRef.current = map;

    return () => {
      callbacksRef.current.onTeardown(map);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  /** Swap the basemap style and re-sync custom layers after style.load. */
  useEffect(() => {
    const map = mapRef.current;

    if (!map) return;

    if (skipNextStyleSwapRef.current) {
      skipNextStyleSwapRef.current = false;
      return;
    }

    map.setStyle(getMapStyleUrl(styleId), {
      diff: false,
      transformStyle: transformCustomMapStyle,
    });

    const onStyleLoad = () => {
      callbacksRef.current.syncMapContent(map);
    };

    map.once("style.load", onStyleLoad);

    return () => {
      map.off("style.load", onStyleLoad);
    };
  }, [mapRef, styleId]);
}
