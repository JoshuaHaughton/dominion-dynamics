import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { ZoneGeoJson } from "@dominion-dynamics/shared";
import type { MapStyleId } from "../../lib/constants/mapStyles.js";
import { useFadeMotionProps } from "../../lib/motion/useFadeMotion.js";
import { useFeedStatusStore } from "../../lib/stores/feedStatusStore.js";
import { useOperationsStore } from "../../lib/stores/operationsStore.js";
import { AssetInfoPanel } from "../AssetInfoPanel/AssetInfoPanel.js";
import { OperationsPanel } from "../OperationsPanel/OperationsPanel.js";
import { useLiveAssets } from "./assets/useLiveAssets.js";
import { usePatrolPath } from "./patrol/usePatrolPath.js";
import { useZones } from "./zones/useZones.js";
import {
  boundsFromPatrolPath,
  boundsFromZoneGeoJson,
} from "./map/mapFocusUtils.js";
import { MapToolbar } from "./MapToolbar/MapToolbar.js";
import { useLiveMap } from "./map/useLiveMap.js";
import { useMapKeyboardShortcuts } from "./map/useMapKeyboardShortcuts.js";
import overlayStyles from "../MapLoadingOverlay/MapLoadingOverlay.module.css";
import styles from "./LiveMap.module.css";

type LiveMapProps = {
  styleId: MapStyleId;
};

/** MapLibre map with live assets, restricted zones, and patrol route drawing. */
export function LiveMap({ styleId }: LiveMapProps) {
  const fadeMotion = useFadeMotionProps();
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

  const selectedAsset =
    assets.find((asset) => asset.id === selectedAssetId) ?? null;

  useEffect(() => {
    if (selectedAssetId !== null && selectedAsset === null) {
      selectAsset(null);
    }
  }, [selectAsset, selectedAsset, selectedAssetId]);

  const mapVisualFilter = {
    entityTab,
    statusFilter,
    selectedAssetId,
  };

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
        zonesError={zoneDrawError}
        selectedAssetId={selectedAssetId}
        entityTab={entityTab}
        statusFilter={statusFilter}
        onEntityTabChange={setEntityTab}
        onStatusFilterChange={setStatusFilter}
        onSelectAsset={selectAndFocusAsset}
        onSelectZone={handleSelectZone}
        onDeleteZone={removeZone}
      />
      <AnimatePresence initial={false}>
        {!isMapReady ? (
          <motion.div
            key="map-loading"
            className={overlayStyles.overlay}
            aria-live="polite"
            aria-busy="true"
            {...fadeMotion}
          >
            <p className={overlayStyles.message}>Connecting to live feed…</p>
          </motion.div>
        ) : null}
        {selectedAsset !== null ? (
          <AssetInfoPanel
            key={selectedAsset.id}
            asset={selectedAsset}
            assets={assets}
            isFollowingCamera={isFollowingCamera}
            onFollowingChange={setFollowingCamera}
            onClose={() => {
              setFollowingCamera(false);
              selectAsset(null);
            }}
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
}
