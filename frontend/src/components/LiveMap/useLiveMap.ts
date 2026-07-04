import maplibregl, { type Map } from "maplibre-gl";
import type { Asset, ZoneGeoJson } from "@dominion-dynamics/shared";
import type { MapStyleId } from "../../lib/constants/mapStyles.js";
import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import {
  DEMO_SEED_REGION,
  INITIAL_MAP_ZOOM,
  MAP_FIT_PADDING,
} from "../../lib/constants/mapConstants.js";
import { getMapStyleUrl } from "../../lib/constants/mapStyles.js";
import type { ZoneView } from "../../lib/hooks/useZones.js";
import { disableBasemapTerrain, getRegionCenter, toFitBounds } from "../../lib/utils/mapUtils.js";
import { syncAssetLayers, updateAssetLayerData } from "./liveMapUtils.js";
import {
  attachZoneDrawControl,
  detachZoneDrawControl,
  startZoneDraw,
} from "./zoneDrawControl.js";
import type { MaplibreTerradrawControl } from "@watergis/maplibre-gl-terradraw";
import { syncZoneLayers, updateZoneLayerData } from "./zoneMapUtils.js";

export type LiveMapInput = {
  assets: readonly Asset[];
  styleId: MapStyleId;
  zones: readonly ZoneView[];
  onZoneDrawn: (geojson: ZoneGeoJson) => void;
  onZoneDrawError: (message: string) => void;
};

type UseLiveMapResult = {
  containerRef: RefObject<HTMLDivElement | null>;
  beginZoneDraw: () => void;
  isDrawingZone: boolean;
};

/** Manage MapLibre lifecycle and sync assets + zones onto the map. */
export function useLiveMap({
  assets,
  styleId,
  zones,
  onZoneDrawn,
  onZoneDrawError,
}: LiveMapInput): UseLiveMapResult {
  // Map instance and one-time mount state
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const drawControlRef = useRef<MaplibreTerradrawControl | undefined>(
    undefined,
  );
  const hasFitBoundsRef = useRef(false);
  const skipNextStyleSwapRef = useRef(true);

  // Latest props for MapLibre / Terra Draw callbacks
  const assetsRef = useRef(assets);
  assetsRef.current = assets;
  const zonesRef = useRef(zones);
  zonesRef.current = zones;
  const onZoneDrawnRef = useRef(onZoneDrawn);
  onZoneDrawnRef.current = onZoneDrawn;
  const onZoneDrawErrorRef = useRef(onZoneDrawError);
  onZoneDrawErrorRef.current = onZoneDrawError;

  const [isDrawingZone, setIsDrawingZone] = useState(false);

  const beginZoneDraw = useCallback(() => {
    startZoneDraw(drawControlRef.current, isDrawingZone);
  }, [isDrawingZone]);

  function setupDrawControl(map: Map): void {
    detachZoneDrawControl(map, drawControlRef.current);
    drawControlRef.current = attachZoneDrawControl(
      map,
      (geojson) => {
        onZoneDrawnRef.current(geojson);
      },
      setIsDrawingZone,
      (message) => {
        onZoneDrawErrorRef.current(message);
      },
    );
  }

  function syncMapContent(map: Map): void {
    disableBasemapTerrain(map);
    syncZoneLayers(map, zonesRef.current);
    void syncAssetLayers(map, assetsRef.current).then(() => {
      fitDemoRegionIfNeeded(map, assetsRef.current.length);
    });
    setupDrawControl(map);
  }

  /** Create the map once, attach controls, and tear down on unmount. */
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
      syncMapContent(map);
    });

    mapRef.current = map;

    return () => {
      detachZoneDrawControl(map, drawControlRef.current);
      drawControlRef.current = undefined;
      map.remove();
      mapRef.current = null;
      hasFitBoundsRef.current = false;
      setIsDrawingZone(false);
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

    map.setStyle(getMapStyleUrl(styleId));

    const onStyleLoad = () => {
      syncMapContent(map);
    };

    map.once("style.load", onStyleLoad);

    return () => {
      map.off("style.load", onStyleLoad);
    };
  }, [styleId]);

  /** Push the latest zone list into the GeoJSON source. */
  useEffect(() => {
    const map = mapRef.current;

    if (!map?.isStyleLoaded()) {
      return;
    }

    updateZoneLayerData(map, zones);
  }, [zones]);

  /** Push the latest asset snapshot into the map and fit once on first data. */
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

  return { containerRef, beginZoneDraw, isDrawingZone };
}
