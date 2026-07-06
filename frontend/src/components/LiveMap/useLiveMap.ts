import type { LngLatBoundsLike, Map as MapLibreMap } from "maplibre-gl";
import type {
  Asset,
  AssetTrackDetail,
  PathGeoJson,
  ZoneGeoJson,
} from "@dominion-dynamics/shared";
import type { MapStyleId } from "../../lib/constants/mapStyles.js";
import { useCallback, useEffect, useRef, type RefObject } from "react";
import { MAP_CAMERA_ANIMATION_MS } from "../../lib/constants/mapConstants.js";
import type { MapVisualFilter } from "../../lib/utils/assetSymbology.js";
import type { ZoneView } from "./hooks/useZones.js";
import type { MapContext } from "./mapContext.js";
import { easeMapToPoint, fitMapToBounds } from "./map/mapFocusUtils.js";
import { useMapInstance } from "./hooks/useMapInstance.js";
import { useMapLayerSync } from "./hooks/useMapLayerSync.js";
import { useMapDrawAndInteraction } from "./hooks/useMapDrawAndInteraction.js";

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
  mapVisualFilter: MapVisualFilter;
  selectAsset: (assetId: string | null) => void;
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
  /** Select in the store and center the camera (map clicks and panel rows). */
  selectAndFocusAsset: (assetId: string | null) => void;
  /** Center on an asset; reused by follow and future header focus chips. */
  focusOnAsset: (assetId: string, options?: MapFocusOptions) => void;
  /** Fit the viewport to bounds; reused by patrol route and zone focus. */
  focusOnBounds: (bounds: LngLatBoundsLike, options?: MapFocusOptions) => void;
};

function cameraDuration(options?: MapFocusOptions): number {
  return options?.animate === false ? 0 : MAP_CAMERA_ANIMATION_MS;
}

/**
 * Orchestrates the live map: owns the shared refs, composes the lifecycle /
 * layer-sync / draw hooks, and keeps camera focus + selection here.
 */
export function useLiveMap({
  assets,
  styleId,
  zones,
  patrolPath,
  trackDetail,
  selectedAssetId,
  isFollowingCamera,
  mapVisualFilter,
  selectAsset,
  onFollowingChange,
  onZoneDrawn,
  onPatrolPathDrawn,
  onZoneDrawError,
  onPatrolDrawError,
}: LiveMapInput): UseLiveMapResult {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const assetsRef = useRef(assets);

  useEffect(() => {
    assetsRef.current = assets;
  });

  const focusOnAsset = useCallback(
    (assetId: string, options?: MapFocusOptions) => {
      const map = mapRef.current;
      const asset = assetsRef.current.find(
        (candidate) => candidate.id === assetId,
      );

      if (!map || !asset) return;

      easeMapToPoint(map, asset.lon, asset.lat, cameraDuration(options));
    },
    [],
  );

  const focusOnBounds = useCallback(
    (bounds: LngLatBoundsLike, options?: MapFocusOptions) => {
      const map = mapRef.current;

      if (!map) return;

      fitMapToBounds(map, bounds, cameraDuration(options));
    },
    [],
  );

  const selectAndFocusAsset = useCallback(
    (assetId: string | null) => {
      selectAsset(assetId);

      if (assetId !== null) {
        focusOnAsset(assetId);
      }
    },
    [focusOnAsset, selectAsset],
  );

  /** Rebuilt each render; consumer hooks keep their own latest-value refs. */
  const mapContext: MapContext = {
    assets,
    zones,
    patrolPath,
    trackDetail,
    selectedAssetId,
    onAssetSelect: selectAndFocusAsset,
    onFollowingChange,
    onZoneDrawn,
    onPatrolPathDrawn,
    onZoneDrawError,
    onPatrolDrawError,
  };

  const {
    isDrawingZone,
    isDrawingPatrol,
    beginZoneDraw,
    beginPatrolDraw,
    setupDrawControl,
    attachInteractionHandlers,
    teardownDraw,
  } = useMapDrawAndInteraction(mapContext);

  const { syncAllLayers, resetLayerSync } = useMapLayerSync({
    mapRef,
    assets,
    zones,
    patrolPath,
    trackDetail,
    selectedAssetId,
    mapVisualFilter,
  });

  const syncMapContent = useCallback(
    (map: MapLibreMap) => {
      syncAllLayers(map);
      setupDrawControl(map);
      attachInteractionHandlers(map);
    },
    [attachInteractionHandlers, setupDrawControl, syncAllLayers],
  );

  const onTeardown = useCallback(
    (map: MapLibreMap) => {
      teardownDraw(map);
      resetLayerSync();
    },
    [resetLayerSync, teardownDraw],
  );

  useMapInstance({ containerRef, mapRef, styleId, syncMapContent, onTeardown });

  /** Re-center on the selected asset each tick while camera follow is enabled. */
  useEffect(() => {
    if (!isFollowingCamera || selectedAssetId === null) {
      return;
    }

    focusOnAsset(selectedAssetId);
  }, [assets, focusOnAsset, isFollowingCamera, selectedAssetId]);

  return {
    containerRef,
    beginZoneDraw,
    beginPatrolDraw,
    isDrawingZone,
    isDrawingPatrol,
    selectAndFocusAsset,
    focusOnAsset,
    focusOnBounds,
  };
}
