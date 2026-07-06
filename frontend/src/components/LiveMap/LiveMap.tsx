import { useEffect, useMemo } from "react";
import type {
  Asset,
  AssetTrackDetail,
  PathGeoJson,
  ZoneGeoJson,
} from "@dominion-dynamics/shared";
import type { MapStyleId } from "../../lib/constants/mapStyles.js";
import type { ZoneView } from "../../lib/hooks/useZones.js";
import { AssetInfoPanel } from "./AssetInfoPanel.js";
import { useLiveMap } from "./useLiveMap.js";
import styles from "./LiveMap.module.css";

type LiveMapProps = {
  assets: readonly Asset[];
  styleId: MapStyleId;
  zones: readonly ZoneView[];
  patrolPath: PathGeoJson | null;
  selectedAssetId: string | null;
  trackDetail: AssetTrackDetail | null;
  onAssetSelect: (assetId: string | null) => void;
  onZoneDrawn: (geojson: ZoneGeoJson) => void;
  onPatrolPathDrawn: (geojson: PathGeoJson) => void;
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
  selectedAssetId,
  trackDetail,
  onAssetSelect,
  onZoneDrawn,
  onPatrolPathDrawn,
  zoneDrawError,
  patrolDrawError,
  onZoneDrawError,
  onPatrolDrawError,
  isSavingPatrolPath,
}: LiveMapProps) {
  const selectedAsset = useMemo(
    () => assets.find((asset) => asset.id === selectedAssetId) ?? null,
    [assets, selectedAssetId],
  );

  useEffect(() => {
    if (selectedAssetId !== null && selectedAsset === null) {
      onAssetSelect(null);
    }
  }, [onAssetSelect, selectedAsset, selectedAssetId]);

  const {
    containerRef,
    beginZoneDraw,
    beginPatrolDraw,
    isDrawingZone,
    isDrawingPatrol,
  } = useLiveMap({
    assets,
    styleId,
    zones,
    patrolPath,
    trackDetail,
    selectedAssetId,
    onAssetSelect,
    onZoneDrawn,
    onPatrolPathDrawn,
    onZoneDrawError,
    onPatrolDrawError,
  });

  return (
    <div className={styles.wrapper}>
      <div ref={containerRef} className={styles.map} />
      <div className={styles.toolbar}>
        <div className={styles.drawTool}>
          <button
            type="button"
            className={`${styles.drawButton} ${isDrawingZone ? styles.drawButtonActive : ""}`}
            aria-pressed={isDrawingZone}
            onClick={beginZoneDraw}
          >
            Draw zone
          </button>
          {isDrawingZone && (
            <span className={styles.drawHint}>
              Click to add points. Close on the first point or press Enter.
            </span>
          )}
        </div>
        <div className={styles.drawTool}>
          <button
            type="button"
            className={`${styles.drawButton} ${isDrawingPatrol ? styles.drawButtonActive : ""}`}
            aria-pressed={isDrawingPatrol}
            onClick={beginPatrolDraw}
          >
            Draw patrol path
          </button>
          {isDrawingPatrol && (
            <span className={styles.drawHint}>
              Click to add waypoints. Click the start point to close the loop,
              or the last point or Enter for an open path.
            </span>
          )}
          {isSavingPatrolPath && (
            <span className={styles.drawHint}>Saving patrol path…</span>
          )}
        </div>
        {zoneDrawError !== null && (
          <span className={styles.error} role="status">
            {zoneDrawError}
          </span>
        )}
        {patrolDrawError !== null && (
          <span className={styles.error} role="status">
            {patrolDrawError}
          </span>
        )}
      </div>
      {selectedAsset !== null && (
        <AssetInfoPanel
          asset={selectedAsset}
          assets={assets}
          onClose={() => {
            onAssetSelect(null);
          }}
        />
      )}
    </div>
  );
}
