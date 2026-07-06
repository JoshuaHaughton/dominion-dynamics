import { useEffect, useMemo, useRef, useCallback } from "react";
import type {
  Asset,
  AssetTrackDetail,
  PathGeoJson,
  ZoneGeoJson,
} from "@dominion-dynamics/shared";
import type { MapStyleId } from "../../lib/constants/mapStyles.js";
import type { ZoneView } from "../../lib/hooks/useZones.js";
import { useOperationsStore } from "../../lib/stores/operationsStore.js";
import {
  boundsFromPatrolPath,
  boundsFromZoneGeoJson,
} from "../../lib/utils/mapFocusUtils.js";
import { AssetInfoPanel } from "./AssetInfoPanel.js";
import { OperationsPanel } from "./OperationsPanel.js";
import { useLiveMap } from "./useLiveMap.js";
import styles from "./LiveMap.module.css";

type LiveMapProps = {
  assets: readonly Asset[];
  styleId: MapStyleId;
  zones: readonly ZoneView[];
  patrolPath: PathGeoJson | null;
  trackDetail: AssetTrackDetail | null;
  onZoneDrawn: (geojson: ZoneGeoJson) => void;
  onPatrolPathDrawn: (geojson: PathGeoJson) => void;
  onZoneDelete: (zoneId: number) => void;
  onZoneDrawError: (message: string) => void;
  onPatrolDrawError: (message: string) => void;
  zoneDrawError: string | null;
  patrolDrawError: string | null;
  isSavingPatrolPath: boolean;
};

/** MapLibre map with live assets, restricted zones, and patrol route drawing. */
export function LiveMap({
  assets,
  styleId,
  zones,
  patrolPath,
  trackDetail,
  onZoneDrawn,
  onPatrolPathDrawn,
  onZoneDelete,
  zoneDrawError,
  patrolDrawError,
  onZoneDrawError,
  onPatrolDrawError,
  isSavingPatrolPath,
}: LiveMapProps) {
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

  const focusHandlersRef = useRef({
    selectAsset,
    focusOnAsset: (_assetId: string) => {},
  });

  const onAssetSelect = useCallback((assetId: string | null) => {
    const { selectAsset: select, focusOnAsset: focus } = focusHandlersRef.current;

    if (assetId === null) {
      select(null);
      return;
    }

    select(assetId);
    focus(assetId);
  }, []);

  const {
    containerRef,
    beginZoneDraw,
    beginPatrolDraw,
    isDrawingZone,
    isDrawingPatrol,
    focusOnAsset,
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
    onAssetSelect,
    onFollowingChange: setFollowingCamera,
    onZoneDrawn,
    onPatrolPathDrawn,
    onZoneDrawError,
    onPatrolDrawError,
  });

  focusHandlersRef.current = { selectAsset, focusOnAsset };

  const drawHint = isDrawingZone
    ? "Click to add points. Close on the first point or press Enter."
    : isDrawingPatrol
      ? "Click to add waypoints. Click the start point to close the loop, or the last point or Enter for an open path."
      : isSavingPatrolPath
        ? "Saving patrol path…"
        : null;

  function focusPatrolRoute(): void {
    if (patrolPath === null) {
      return;
    }

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
      <div className={styles.toolbarPanel}>
        <div className={styles.toolbarRow}>
          <div
            className={styles.drawGroup}
            role="group"
            aria-label="Map drawing tools"
          >
            <button
              type="button"
              className={`${styles.drawButton} ${isDrawingZone ? styles.drawButtonActive : ""}`}
              aria-pressed={isDrawingZone}
              onClick={beginZoneDraw}
            >
              Draw restricted zone
            </button>
            <button
              type="button"
              className={`${styles.drawButton} ${isDrawingPatrol ? styles.drawButtonActive : ""}`}
              aria-pressed={isDrawingPatrol}
              onClick={beginPatrolDraw}
            >
              Draw patrol path
            </button>
          </div>
          {patrolPath !== null ? (
            <>
              <span className={styles.toolbarDivider} aria-hidden="true" />
              <div
                className={styles.focusGroup}
                role="group"
                aria-label="Map focus shortcuts"
              >
                <button
                  type="button"
                  className={styles.focusButton}
                  onClick={focusPatrolRoute}
                >
                  Focus patrol route
                </button>
              </div>
            </>
          ) : null}
        </div>
        {drawHint !== null ? (
          <p className={styles.drawHint} role="status">
            {drawHint}
          </p>
        ) : null}
        {zoneDrawError !== null ? (
          <p className={styles.error} role="status">
            {zoneDrawError}
          </p>
        ) : null}
        {patrolDrawError !== null ? (
          <p className={styles.error} role="status">
            {patrolDrawError}
          </p>
        ) : null}
      </div>
      <OperationsPanel
        assets={assets}
        zones={zones}
        selectedAssetId={selectedAssetId}
        entityTab={entityTab}
        statusFilter={statusFilter}
        onEntityTabChange={setEntityTab}
        onStatusFilterChange={setStatusFilter}
        onSelectAsset={onAssetSelect}
        onSelectZone={handleSelectZone}
        onDeleteZone={onZoneDelete}
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
    </div>
  );
}
