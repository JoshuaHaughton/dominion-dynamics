import maplibregl, { type LngLatBoundsLike, type Map } from "maplibre-gl";
import type {
  Asset,
  AssetTrackDetail,
  PathGeoJson,
  ThreatLevel,
  ZoneGeoJson,
} from "@dominion-dynamics/shared";
import type { MapStyleId } from "../../lib/constants/mapStyles.js";
import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import {
  DEMO_MAP_FOCUS_REGION,
  INITIAL_MAP_ZOOM,
  MAP_CAMERA_ANIMATION_MS,
  MAP_FIT_PADDING,
  MAP_LAYERS,
} from "../../lib/constants/mapConstants.js";
import { getMapStyleUrl } from "../../lib/constants/mapStyles.js";
import { transformCustomMapStyle } from "../../lib/utils/mapStyleTransform.js";
import {
  boundsFromPatrolPath,
  easeMapToPoint,
  fitMapToBounds,
} from "../../lib/utils/mapFocusUtils.js";
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
  attachDrawControl,
  detachDrawControl,
  startZoneDraw,
} from "./drawControl.js";
import { startPatrolDraw } from "./patrolDrawControl.js";
import type { MaplibreTerradrawControl } from "@watergis/maplibre-gl-terradraw";
import { syncZoneLayers, updateZoneLayerData } from "./zoneMapUtils.js";
import {
  syncPatrolPathLayers,
  updatePatrolPathLayerData,
} from "./patrolPathMapUtils.js";

export type MapFocusOptions = {
  animate?: boolean;
};

export type LiveMapInput = {
  assets: readonly Asset[];
  styleId: MapStyleId;
  zones: readonly ZoneView[];
  patrolPath: PathGeoJson | null;
  trackDetail: AssetTrackDetail | null;
  selectedAssetId: string | null;
  isFollowingCamera: boolean;
  /** Incremented from App when the operator clicks "Patrol route saved". */
  patrolFocusRequest: number;
  onAssetSelect: (assetId: string | null) => void;
  onFollowingChange: (isFollowing: boolean) => void;
  onZoneDrawn: (geojson: ZoneGeoJson) => void;
  onPatrolPathDrawn: (geojson: PathGeoJson) => void;
  onZoneDrawError: (message: string) => void;
  onPatrolDrawError: (message: string) => void;
};

type MapContext = {
  assets: readonly Asset[];
  zones: readonly ZoneView[];
  patrolPath: PathGeoJson | null;
  trackDetail: AssetTrackDetail | null;
  isDrawingZone: boolean;
  isDrawingPatrol: boolean;
  onAssetSelect: (assetId: string | null) => void;
  onFollowingChange: (isFollowing: boolean) => void;
  onZoneDrawn: (geojson: ZoneGeoJson) => void;
  onPatrolPathDrawn: (geojson: PathGeoJson) => void;
  onZoneDrawError: (message: string) => void;
  onPatrolDrawError: (message: string) => void;
};

type UseLiveMapResult = {
  containerRef: RefObject<HTMLDivElement | null>;
  beginZoneDraw: () => void;
  beginPatrolDraw: () => void;
  isDrawingZone: boolean;
  isDrawingPatrol: boolean;
  /** Center on an asset; reused by follow and future header focus chips. */
  focusOnAsset: (assetId: string, options?: MapFocusOptions) => void;
  /** Fit the viewport to bounds; reused by patrol route and zone focus. */
  focusOnBounds: (bounds: LngLatBoundsLike, options?: MapFocusOptions) => void;
};

function getSelectedThreat(
  assets: readonly Asset[],
  selectedAssetId: string | null,
): ThreatLevel {
  if (selectedAssetId === null) {
    return "normal";
  }

  return assets.find((asset) => asset.id === selectedAssetId)?.zone?.threat ?? "normal";
}

function isDrawing(context: MapContext): boolean {
  return context.isDrawingZone || context.isDrawingPatrol;
}

function cameraDuration(options?: MapFocusOptions): number {
  return options?.animate === false ? 0 : MAP_CAMERA_ANIMATION_MS;
}

/** MapLibre lifecycle, layer sync, draw controls, and camera focus for the live map. */
export function useLiveMap({
  assets,
  styleId,
  zones,
  patrolPath,
  trackDetail,
  selectedAssetId,
  isFollowingCamera,
  patrolFocusRequest,
  onAssetSelect,
  onFollowingChange,
  onZoneDrawn,
  onPatrolPathDrawn,
  onZoneDrawError,
  onPatrolDrawError,
}: LiveMapInput): UseLiveMapResult {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const drawControlRef = useRef<MaplibreTerradrawControl | undefined>(
    undefined,
  );
  const hasFitBoundsRef = useRef(false);
  const skipNextStyleSwapRef = useRef(true);
  const clickHandlersAttachedRef = useRef(false);
  /** Latest props/callbacks for map listeners without re-binding handlers each render. */
  const mapContextRef = useRef<MapContext>({
    assets,
    zones,
    patrolPath,
    trackDetail,
    isDrawingZone: false,
    isDrawingPatrol: false,
    onAssetSelect,
    onFollowingChange,
    onZoneDrawn,
    onPatrolPathDrawn,
    onZoneDrawError,
    onPatrolDrawError,
  });

  const [isDrawingZone, setIsDrawingZone] = useState(false);
  const [isDrawingPatrol, setIsDrawingPatrol] = useState(false);

  mapContextRef.current = {
    assets,
    zones,
    patrolPath,
    trackDetail,
    isDrawingZone,
    isDrawingPatrol,
    onAssetSelect,
    onFollowingChange,
    onZoneDrawn,
    onPatrolPathDrawn,
    onZoneDrawError,
    onPatrolDrawError,
  };

  const resetDrawMode = useCallback(() => {
    drawControlRef.current?.resetActiveMode();
    setIsDrawingZone(false);
    setIsDrawingPatrol(false);
  }, []);

  const beginZoneDraw = useCallback(() => {
    if (isDrawingPatrol) {
      resetDrawMode();
    }

    startZoneDraw(drawControlRef.current, isDrawingZone);
  }, [isDrawingPatrol, isDrawingZone, resetDrawMode]);

  const beginPatrolDraw = useCallback(() => {
    if (isDrawingZone) {
      resetDrawMode();
    }

    startPatrolDraw(drawControlRef.current, isDrawingPatrol);
  }, [isDrawingPatrol, isDrawingZone, resetDrawMode]);

  const focusOnBounds = useCallback(
    (bounds: LngLatBoundsLike, options?: MapFocusOptions) => {
      const map = mapRef.current;

      if (!map) {
        return;
      }

      fitMapToBounds(map, bounds, MAP_FIT_PADDING, cameraDuration(options));
    },
    [],
  );

  const focusOnAsset = useCallback(
    (assetId: string, options?: MapFocusOptions) => {
      const map = mapRef.current;
      const asset = mapContextRef.current.assets.find(
        (candidate) => candidate.id === assetId,
      );

      if (!map || !asset) {
        return;
      }

      easeMapToPoint(map, asset.lon, asset.lat, cameraDuration(options));
    },
    [],
  );

  function setupDrawControl(map: Map): void {
    detachDrawControl(map, drawControlRef.current);
    drawControlRef.current = attachDrawControl(map, {
      onZoneComplete: (geojson) => {
        mapContextRef.current.onZoneDrawn(geojson);
      },
      onPatrolPathComplete: (geojson) => {
        mapContextRef.current.onPatrolPathDrawn(geojson);
      },
      onZoneDrawingChange: setIsDrawingZone,
      onPatrolDrawingChange: setIsDrawingPatrol,
      onDrawError: (message) => {
        const context = mapContextRef.current;

        if (context.isDrawingPatrol) {
          context.onPatrolDrawError(message);
          return;
        }

        context.onZoneDrawError(message);
      },
    });
  }

  function syncMapContent(map: Map): void {
    const context = mapContextRef.current;
    const selectedThreat = getSelectedThreat(context.assets, selectedAssetId);

    disableBasemapTerrain(map);
    syncZoneLayers(map, context.zones);
    syncPatrolPathLayers(map, context.patrolPath);
    void syncAssetLayers(map, context.assets).then(() => {
      syncAssetTrackLayers(map, context.trackDetail, selectedThreat);
      fitDemoRegionIfNeeded(map, context.assets.length);
    });
    setupDrawControl(map);
    attachAssetClickHandlers(map);
    attachUserCameraHandlers(map);
  }

  function attachUserCameraHandlers(map: Map): void {
    const stopFollowingOnUserInput = (event: maplibregl.MapLibreEvent) => {
      if (!event.originalEvent) {
        return;
      }

      mapContextRef.current.onFollowingChange(false);
    };

    map.on("dragstart", stopFollowingOnUserInput);
    map.on("zoomstart", stopFollowingOnUserInput);
  }

  function attachAssetClickHandlers(map: Map): void {
    if (clickHandlersAttachedRef.current) {
      return;
    }

    clickHandlersAttachedRef.current = true;

    map.on("click", MAP_LAYERS.assetsCircles, (event) => {
      const context = mapContextRef.current;

      if (isDrawing(context)) {
        return;
      }

      const feature = event.features?.[0];
      const assetId = feature?.properties?.id;

      if (typeof assetId === "string" && assetId.length > 0) {
        context.onAssetSelect(assetId);
      }
    });

    map.on("mouseenter", MAP_LAYERS.assetsCircles, () => {
      if (!isDrawing(mapContextRef.current)) {
        map.getCanvas().style.cursor = "pointer";
      }
    });

    map.on("mouseleave", MAP_LAYERS.assetsCircles, () => {
      map.getCanvas().style.cursor = "";
    });

    map.on("click", (event) => {
      const context = mapContextRef.current;

      if (isDrawing(context)) {
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
      center: getRegionCenter(DEMO_MAP_FOCUS_REGION),
      zoom: INITIAL_MAP_ZOOM,
      // Private demo build; no on-map tile attribution chrome.
      attributionControl: false,
    });

    map.addControl(new maplibregl.NavigationControl(), "bottom-left");

    map.on("load", () => {
      syncMapContent(map);
    });

    mapRef.current = map;

    return () => {
      detachDrawControl(map, drawControlRef.current);
      drawControlRef.current = undefined;
      map.remove();
      mapRef.current = null;
      hasFitBoundsRef.current = false;
      clickHandlersAttachedRef.current = false;
      setIsDrawingZone(false);
      setIsDrawingPatrol(false);
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
      updatePatrolPathLayerData(map, context.patrolPath);
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

  /** Push the latest patrol route into the GeoJSON source. */
  useEffect(() => {
    const map = mapRef.current;

    if (!map?.isStyleLoaded()) {
      return;
    }

    updatePatrolPathLayerData(map, patrolPath);
  }, [patrolPath]);

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

  /** Re-center on the selected asset each tick while camera follow is enabled. */
  useEffect(() => {
    if (!isFollowingCamera || selectedAssetId === null) {
      return;
    }

    focusOnAsset(selectedAssetId);
  }, [assets, focusOnAsset, isFollowingCamera, selectedAssetId]);

  /** Focus the saved patrol route when the header chip is clicked. */
  useEffect(() => {
    if (patrolFocusRequest === 0 || patrolPath === null) {
      return;
    }

    const bounds = boundsFromPatrolPath(patrolPath);

    if (bounds === null) {
      return;
    }

    focusOnBounds(bounds);
  }, [focusOnBounds, patrolFocusRequest, patrolPath]);

  /** One-time initial fit; skipped after so patrol/asset focus is not overridden. */
  function fitDemoRegionIfNeeded(map: Map, assetCount: number): void {
    if (hasFitBoundsRef.current || assetCount === 0) {
      return;
    }

    fitMapToBounds(
      map,
      toFitBounds(DEMO_MAP_FOCUS_REGION),
      MAP_FIT_PADDING,
      0,
    );
    hasFitBoundsRef.current = true;
  }

  return {
    containerRef,
    beginZoneDraw,
    beginPatrolDraw,
    isDrawingZone,
    isDrawingPatrol,
    focusOnAsset,
    focusOnBounds,
  };
}
