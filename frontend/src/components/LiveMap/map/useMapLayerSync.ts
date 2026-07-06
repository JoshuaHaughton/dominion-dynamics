import type { Map as MapLibreMap } from "maplibre-gl";
import type {
  Asset,
  AssetTrackDetail,
  PathGeoJson,
} from "@dominion-dynamics/shared";
import { useEffect, useLayoutEffect, useRef, type RefObject } from "react";
import { MAP_LAYERS, DEMO_MAP_FOCUS_REGION } from "../../../lib/constants/mapConstants.js";
import type { MapVisualFilter } from "../../../lib/utils/assetSymbology.js";
import type { ZoneView } from "../zones/useZones.js";
import { syncAssetLayers, updateAssetLayerData } from "../assets/liveMapUtils.js";
import {
  clearAssetTrackLayers,
  syncAssetTrackLayers,
  updateAssetTrackLayerData,
} from "../assets/assetTrackMapUtils.js";
import {
  syncZoneLayers,
  updateZoneLayerData,
} from "../zones/zoneMapUtils.js";
import {
  syncPatrolPathLayers,
  updatePatrolPathLayerData,
} from "../patrol/patrolPathMapUtils.js";
import { disableBasemapTerrain, toFitBounds } from "./mapUtils.js";
import { fitMapToBounds } from "./mapFocusUtils.js";
import { selectedAssetThreat } from "./selectedAssetDerived.js";

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
) {
  return selectedAssetThreat(assets, selectedAssetId);
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

  useLayoutEffect(() => {
    latestRef.current = {
      assets,
      zones,
      patrolPath,
      trackDetail,
      selectedAssetId,
      mapVisualFilter,
    };
  });

  const selectedThreat = getSelectedThreat(assets, selectedAssetId);

  function syncAllLayers(map: MapLibreMap) {
    const latest = latestRef.current;
    const threat = getSelectedThreat(latest.assets, latest.selectedAssetId);

    disableBasemapTerrain(map);
    syncZoneLayers(map, latest.zones);
    // Patrol before assets so markers render above the route line.
    syncPatrolPathLayers(map, latest.patrolPath);
    void syncAssetLayers(map, latest.assets, latest.mapVisualFilter).then(
      () => {
        syncAssetTrackLayers(map, latest.trackDetail, threat);
      },
    );
  }

  /** Push the latest zone list into the GeoJSON source. */
  useEffect(() => {
    const map = mapRef.current;

    if (!map) return;

    if (map.getLayer(MAP_LAYERS.zonesFill)) {
      updateZoneLayerData(map, zones);
    } else if (map.isStyleLoaded()) {
      syncZoneLayers(map, zones);
    }
  }, [mapRef, zones]);

  /** Push the latest patrol route into the GeoJSON source. */
  useEffect(() => {
    const map = mapRef.current;

    if (!map) return;

    if (map.getLayer(MAP_LAYERS.patrolPathLine)) {
      updatePatrolPathLayerData(map, patrolPath);
    } else if (map.isStyleLoaded()) {
      syncPatrolPathLayers(map, patrolPath);
    }
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
  }, [mapRef, assets, mapVisualFilter]);

  function resetLayerSync() {
    hasFitBoundsRef.current = false;
  }

  return { syncAllLayers, resetLayerSync };
}
