import maplibregl, { type Map } from "maplibre-gl";
import type { Asset, AssetTrackDetail, ThreatLevel, ZoneGeoJson } from "@dominion-dynamics/shared";
import type { MapStyleId } from "../../lib/constants/mapStyles.js";
import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import {
  DEMO_SEED_REGION,
  INITIAL_MAP_ZOOM,
  MAP_FIT_PADDING,
  MAP_LAYERS,
} from "../../lib/constants/mapConstants.js";
import { getMapStyleUrl } from "../../lib/constants/mapStyles.js";
import { transformCustomMapStyle } from "../../lib/utils/mapStyleTransform.js";
import type { ZoneView } from "../../lib/hooks/useZones.js";
import { disableBasemapTerrain, getRegionCenter, toFitBounds } from "../../lib/utils/mapUtils.js";
import { syncAssetLayers } from "./liveMapUtils.js";
import { pushAssetsToMap } from "./pushAssetsToMap.js";
import {
  clearAssetTrackLayers,
  syncAssetTrackLayers,
  updateAssetTrackLayerData,
} from "./assetTrackMapUtils.js";
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
  trackDetail: AssetTrackDetail | null;
  selectedAssetId: string | null;
  onAssetSelect: (assetId: string | null) => void;
  onZoneDrawn: (geojson: ZoneGeoJson) => void;
  onZoneDrawError: (message: string) => void;
};

type MapContext = {
  assets: readonly Asset[];
  zones: readonly ZoneView[];
  trackDetail: AssetTrackDetail | null;
  isDrawingZone: boolean;
  onAssetSelect: (assetId: string | null) => void;
  onZoneDrawn: (geojson: ZoneGeoJson) => void;
  onZoneDrawError: (message: string) => void;
};

type UseLiveMapResult = {
  containerRef: RefObject<HTMLDivElement | null>;
  beginZoneDraw: () => void;
  isDrawingZone: boolean;
};

function getSelectedThreat(
  assets: readonly Asset[],
  selectedAssetId: string | null,
): ThreatLevel {
  if (selectedAssetId === null) {
    return "normal";
  }

  return assets.find((asset) => asset.id === selectedAssetId)?.threat ?? "normal";
}

/** Manage MapLibre lifecycle and sync assets + zones onto the map. */
export function useLiveMap({
  assets,
  styleId,
  zones,
  trackDetail,
  selectedAssetId,
  onAssetSelect,
  onZoneDrawn,
  onZoneDrawError,
}: LiveMapInput): UseLiveMapResult {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const drawControlRef = useRef<MaplibreTerradrawControl | undefined>(
    undefined,
  );
  const hasFitBoundsRef = useRef(false);
  const skipNextStyleSwapRef = useRef(true);
  const clickHandlersAttachedRef = useRef(false);
  const mapContextRef = useRef<MapContext>({
    assets,
    zones,
    trackDetail,
    isDrawingZone: false,
    onAssetSelect,
    onZoneDrawn,
    onZoneDrawError,
  });

  const [isDrawingZone, setIsDrawingZone] = useState(false);

  mapContextRef.current = {
    assets,
    zones,
    trackDetail,
    isDrawingZone,
    onAssetSelect,
    onZoneDrawn,
    onZoneDrawError,
  };

  const beginZoneDraw = useCallback(() => {
    startZoneDraw(drawControlRef.current, isDrawingZone);
  }, [isDrawingZone]);

  function setupDrawControl(map: Map): void {
    detachZoneDrawControl(map, drawControlRef.current);
    drawControlRef.current = attachZoneDrawControl(
      map,
      (geojson) => {
        mapContextRef.current.onZoneDrawn(geojson);
      },
      setIsDrawingZone,
      (message) => {
        mapContextRef.current.onZoneDrawError(message);
      },
    );
  }

  function syncMapContent(map: Map): void {
    const context = mapContextRef.current;
    const selectedThreat = getSelectedThreat(context.assets, selectedAssetId);

    disableBasemapTerrain(map);
    syncZoneLayers(map, context.zones);
    void syncAssetLayers(map, context.assets).then(() => {
      syncAssetTrackLayers(map, context.trackDetail, selectedThreat);
      fitDemoRegionIfNeeded(map, context.assets.length);
    });
    setupDrawControl(map);
    attachAssetClickHandlers(map);
  }

  function attachAssetClickHandlers(map: Map): void {
    if (clickHandlersAttachedRef.current) {
      return;
    }

    clickHandlersAttachedRef.current = true;

    map.on("click", MAP_LAYERS.assetsCircles, (event) => {
      const context = mapContextRef.current;

      if (context.isDrawingZone) {
        return;
      }

      const feature = event.features?.[0];
      const assetId = feature?.properties?.id;

      if (typeof assetId === "string" && assetId.length > 0) {
        context.onAssetSelect(assetId);
      }
    });

    map.on("mouseenter", MAP_LAYERS.assetsCircles, () => {
      if (!mapContextRef.current.isDrawingZone) {
        map.getCanvas().style.cursor = "pointer";
      }
    });

    map.on("mouseleave", MAP_LAYERS.assetsCircles, () => {
      map.getCanvas().style.cursor = "";
    });

    map.on("click", (event) => {
      const context = mapContextRef.current;

      if (context.isDrawingZone) {
        return;
      }

      const hits = map.queryRenderedFeatures(event.point, {
        layers: [MAP_LAYERS.assetsCircles],
      });

      if (hits.length === 0) {
        context.onAssetSelect(null);
      }
    });
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
      clickHandlersAttachedRef.current = false;
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

    map.setStyle(getMapStyleUrl(styleId), {
      diff: false,
      transformStyle: transformCustomMapStyle,
    });

    const onStyleLoad = () => {
      const context = mapContextRef.current;
      const selectedThreat = getSelectedThreat(context.assets, selectedAssetId);

      disableBasemapTerrain(map);
      pushAssetsToMap(map, context.assets);
      updateZoneLayerData(map, context.zones);
      updateAssetTrackLayerData(map, context.trackDetail, selectedThreat);
      setupDrawControl(map);
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

  /** Push track overlays when selection detail changes. */
  useEffect(() => {
    const map = mapRef.current;

    if (!map?.isStyleLoaded()) {
      return;
    }

    const selectedThreat = getSelectedThreat(assets, selectedAssetId);

    if (selectedAssetId === null || trackDetail === null) {
      if (map.getSource(MAP_LAYERS.assetHistorySource)) {
        clearAssetTrackLayers(map);
      }
      return;
    }

    if (map.getSource(MAP_LAYERS.assetHistorySource)) {
      updateAssetTrackLayerData(map, trackDetail, selectedThreat);
      return;
    }

    syncAssetTrackLayers(map, trackDetail, selectedThreat);
  }, [assets, selectedAssetId, trackDetail]);

  /** Push the latest asset snapshot into the map and fit once on first data. */
  useEffect(() => {
    const map = mapRef.current;

    if (!map) {
      return;
    }

    pushAssetsToMap(map, assets);
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
