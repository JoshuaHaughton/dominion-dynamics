import type { Map as MapLibreMap } from "maplibre-gl";
import type {
  Asset,
  AssetTrackDetail,
  PathGeoJson,
  ThreatLevel,
} from "@dominion-dynamics/shared";
import { useCallback, useEffect, useMemo, useRef, type RefObject } from "react";
import { MAP_LAYERS } from "../../../lib/constants/mapConstants.js";
import type { MapVisualFilter } from "../../../lib/utils/assetSymbology.js";
import type { ZoneView } from "./useZones.js";
import { syncAssetLayers, updateAssetLayerData } from "../map/liveMapUtils.js";
import {
  clearAssetTrackLayers,
  syncAssetTrackLayers,
  updateAssetTrackLayerData,
} from "../map/assetTrackMapUtils.js";
import { syncZoneLayers, updateZoneLayerData } from "../map/zoneMapUtils.js";
import {
  syncPatrolPathLayers,
  updatePatrolPathLayerData,
  ensurePatrolPathBelowAssetLayers,
} from "../map/patrolPathMapUtils.js";
import { disableBasemapTerrain, toFitBounds } from "../map/mapUtils.js";
import { fitMapToBounds } from "../map/mapFocusUtils.js";
import { DEMO_MAP_FOCUS_REGION } from "../../../lib/constants/mapConstants.js";

type UseMapLayerSyncInput = {
  mapRef: RefObject<MapLibreMap | null>;
  assets: readonly Asset[];
  zones: readonly ZoneView[];
  patrolPath: PathGeoJson | null;
  trackDetail: AssetTrackDetail | null;
  selectedAssetId: string | null;
  mapVisualFilter: MapVisualFilter;
};

type UseMapLayerSyncResult = {
  /** Attach-or-update every custom layer stack (initial load / style swap). */
  syncAllLayers: (map: MapLibreMap) => void;
  /** Forget the one-shot initial camera fit (map teardown). */
  resetLayerSync: () => void;
};

function getSelectedThreat(
  assets: readonly Asset[],
  selectedAssetId: string | null,
): ThreatLevel {
  if (selectedAssetId === null) {
    return "normal";
  }

  return (
    assets.find((asset) => asset.id === selectedAssetId)?.zone?.threat ??
    "normal"
  );
}

/** Push live data into the map's GeoJSON sources as props change. */
export function useMapLayerSync({
  mapRef,
  assets,
  zones,
  patrolPath,
  trackDetail,
  selectedAssetId,
  mapVisualFilter,
}: UseMapLayerSyncInput): UseMapLayerSyncResult {
  const hasFitBoundsRef = useRef(false);
  /** Latest data for syncAllLayers, which runs from map load/style-swap events. */
  const latestRef = useRef({
    assets,
    zones,
    patrolPath,
    trackDetail,
    selectedAssetId,
    mapVisualFilter,
  });

  useEffect(() => {
    latestRef.current = {
      assets,
      zones,
      patrolPath,
      trackDetail,
      selectedAssetId,
      mapVisualFilter,
    };
  });

  /**
   * Memoized to the threat VALUE so the track effect below re-runs on threat
   * changes without keying off the whole per-tick assets array.
   */
  const selectedThreat = useMemo(
    () => getSelectedThreat(assets, selectedAssetId),
    [assets, selectedAssetId],
  );

  const syncAllLayers = useCallback((map: MapLibreMap) => {
    const latest = latestRef.current;
    const threat = getSelectedThreat(latest.assets, latest.selectedAssetId);

    disableBasemapTerrain(map);
    syncZoneLayers(map, latest.zones);
    syncPatrolPathLayers(map, latest.patrolPath);
    // Track layers attach after asset layers exist so they slot underneath.
    void syncAssetLayers(map, latest.assets, latest.mapVisualFilter).then(
      () => {
        ensurePatrolPathBelowAssetLayers(map);
        syncAssetTrackLayers(map, latest.trackDetail, threat);
      },
    );
  }, []);

  /** Push the latest zone list into the GeoJSON source. */
  useEffect(() => {
    const map = mapRef.current;

    if (!map?.isStyleLoaded()) return;

    updateZoneLayerData(map, zones);
  }, [mapRef, zones]);

  /** Push the latest patrol route into the GeoJSON source. */
  useEffect(() => {
    const map = mapRef.current;

    if (!map?.isStyleLoaded()) return;

    updatePatrolPathLayerData(map, patrolPath);
    ensurePatrolPathBelowAssetLayers(map);
  }, [mapRef, patrolPath]);

  /** Push track overlays when selection detail (or its threat tint) changes. */
  useEffect(() => {
    const map = mapRef.current;

    if (!map?.isStyleLoaded()) return;

    if (
      selectedAssetId === null ||
      trackDetail === null ||
      trackDetail.assetId !== selectedAssetId
    ) {
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
  }, [mapRef, selectedAssetId, selectedThreat, trackDetail]);

  /** Push the latest asset snapshot into the map; initial demo fit runs once on first data. */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (map.getSource(MAP_LAYERS.assetsSource)) {
      updateAssetLayerData(map, assets, mapVisualFilter);
    } else if (map.loaded()) {
      void syncAssetLayers(map, assets, mapVisualFilter);
    }

    if (
      hasFitBoundsRef.current ||
      assets.length === 0 ||
      !map.isStyleLoaded()
    ) {
      return;
    }

    fitMapToBounds(map, toFitBounds(DEMO_MAP_FOCUS_REGION), 0);
    hasFitBoundsRef.current = true;
  }, [assets, mapRef, mapVisualFilter]);

  const resetLayerSync = useCallback(() => {
    hasFitBoundsRef.current = false;
  }, []);

  return { syncAllLayers, resetLayerSync };
}
