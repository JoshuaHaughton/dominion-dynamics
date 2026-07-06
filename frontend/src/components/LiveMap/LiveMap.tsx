import { useEffect, useMemo } from "react";
import type { ZoneGeoJson } from "@dominion-dynamics/shared";
import type { MapStyleId } from "../../lib/constants/mapStyles.js";
import { useFeedStatusStore } from "../../lib/stores/feedStatusStore.js";
import { useOperationsStore } from "../../lib/stores/operationsStore.js";
import { AssetInfoPanel } from "../AssetInfoPanel/AssetInfoPanel.js";
import { MapLoadingOverlay } from "../MapLoadingOverlay/MapLoadingOverlay.js";
import { OperationsPanel } from "../OperationsPanel/OperationsPanel.js";
import { useLiveAssets } from "./hooks/useLiveAssets.js";
import { usePatrolPath } from "./hooks/usePatrolPath.js";
import { useZones } from "./hooks/useZones.js";
import {
  boundsFromPatrolPath,
  boundsFromZoneGeoJson,
} from "./map/mapFocusUtils.js";
import { MapToolbar } from "./MapToolbar/MapToolbar.js";
import { useLiveMap } from "./useLiveMap.js";
import { useMapKeyboardShortcuts } from "./hooks/useMapKeyboardShortcuts.js";
import styles from "./LiveMap.module.css";

type LiveMapProps = {
  styleId: MapStyleId;
};

/** MapLibre map with live assets, restricted zones, and patrol route drawing. */
export function LiveMap({ styleId }: LiveMapProps) {
  const selectedAssetId = useOperationsStore((state) => state.selectedAssetId);
  const isFollowingCamera = useOperationsStore(
    (state) => state.isFollowingCamera,
  );
  const entityTab = useOperationsStore((state) => state.entityTab);
  const statusFilter = useOperationsStore((state) => state.statusFilter);
  const selectAsset = useOperationsStore((state) => state.selectAsset);
  const setFollowingCamera = useOperationsStore(
    (state) => state.setFollowingCamera,
  );
  const setEntityTab = useOperationsStore((state) => state.setEntityTab);
  const setStatusFilter = useOperationsStore((state) => state.setStatusFilter);
  const connected = useFeedStatusStore((state) => state.connected);

  const { assets, trackDetail } = useLiveAssets(selectedAssetId);
  const {
    zones,
    error: zoneDrawError,
    isLoaded: zonesLoaded,
    addZoneFromDraw,
    removeZone,
    reportDrawError: reportZoneDrawError,
  } = useZones();
  const {
    patrolPath,
    isSaving: isSavingPatrolPath,
    isLoaded: patrolPathLoaded,
    error: patrolDrawError,
    addPatrolPathFromDraw,
    reportDrawError: reportPatrolDrawError,
  } = usePatrolPath();

  const isMapReady = connected && zonesLoaded && patrolPathLoaded;

  useMapKeyboardShortcuts({
    selectedAssetId,
    isFollowingCamera,
    selectAsset,
    setFollowingCamera,
  });

  const selectedAsset = useMemo(
    () => assets.find((asset) => asset.id === selectedAssetId) ?? null,
    [assets, selectedAssetId],
  );

  useEffect(() => {
    if (selectedAssetId !== null && selectedAsset === null) {
      selectAsset(null);
    }
  }, [selectAsset, selectedAsset, selectedAssetId]);

  const mapVisualFilter = useMemo(
    () => ({
      entityTab,
      statusFilter,
      selectedAssetId,
    }),
    [entityTab, selectedAssetId, statusFilter],
  );

  const {
    containerRef,
    beginZoneDraw,
    beginPatrolDraw,
    isDrawingZone,
    isDrawingPatrol,
    selectAndFocusAsset,
    focusOnBounds,
  } = useLiveMap({
    assets,
    styleId,
    zones,
    patrolPath,
    trackDetail,
    selectedAssetId,
    isFollowingCamera,
    mapVisualFilter,
    selectAsset,
    onFollowingChange: setFollowingCamera,
    onZoneDrawn: addZoneFromDraw,
    onPatrolPathDrawn: addPatrolPathFromDraw,
    onZoneDrawError: reportZoneDrawError,
    onPatrolDrawError: reportPatrolDrawError,
  });

  function focusPatrolRoute(): void {
    if (patrolPath === null) return;

    const bounds = boundsFromPatrolPath(patrolPath);

    if (bounds !== null) {
      focusOnBounds(bounds);
    }
  }

  function handleSelectZone(geojson: ZoneGeoJson): void {
    const bounds = boundsFromZoneGeoJson(geojson);

    if (bounds !== null) {
      focusOnBounds(bounds);
    }
  }

  return (
    <div className={styles.wrapper}>
      <div ref={containerRef} className={styles.map} />
      <MapToolbar
        isDrawingZone={isDrawingZone}
        isDrawingPatrol={isDrawingPatrol}
        isSavingPatrolPath={isSavingPatrolPath}
        hasPatrolPath={patrolPath !== null}
        zoneDrawError={zoneDrawError}
        patrolDrawError={patrolDrawError}
        onBeginZoneDraw={beginZoneDraw}
        onBeginPatrolDraw={beginPatrolDraw}
        onFocusPatrolRoute={focusPatrolRoute}
      />
      <OperationsPanel
        assets={assets}
        zones={zones}
        selectedAssetId={selectedAssetId}
        entityTab={entityTab}
        statusFilter={statusFilter}
        onEntityTabChange={setEntityTab}
        onStatusFilterChange={setStatusFilter}
        onSelectAsset={selectAndFocusAsset}
        onSelectZone={handleSelectZone}
        onDeleteZone={removeZone}
      />
      {selectedAsset !== null && (
        <AssetInfoPanel
          asset={selectedAsset}
          assets={assets}
          isFollowingCamera={isFollowingCamera}
          onFollowingChange={setFollowingCamera}
          onClose={() => {
            setFollowingCamera(false);
            selectAsset(null);
          }}
        />
      )}
      <MapLoadingOverlay visible={!isMapReady} />
    </div>
  );
}
