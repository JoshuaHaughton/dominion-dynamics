import { useEffect, useMemo } from "react";
import type { Asset, AssetTrackDetail, ZoneGeoJson } from "@dominion-dynamics/shared";
import type { MapStyleId } from "../../lib/constants/mapStyles.js";
import type { ZoneView } from "../../lib/hooks/useZones.js";
import { AssetInfoPanel } from "./AssetInfoPanel.js";
import { useLiveMap } from "./useLiveMap.js";
import styles from "./LiveMap.module.css";

type LiveMapProps = {
  assets: readonly Asset[];
  styleId: MapStyleId;
  zones: readonly ZoneView[];
  selectedAssetId: string | null;
  trackDetail: AssetTrackDetail | null;
  onAssetSelect: (assetId: string | null) => void;
  onZoneDrawn: (geojson: ZoneGeoJson) => void;
  onZoneDrawError: (message: string) => void;
  zoneDrawError: string | null;
};

/** MapLibre map with live assets and restricted zone drawing. */
export function LiveMap({
  assets,
  styleId,
  zones,
  selectedAssetId,
  trackDetail,
  onAssetSelect,
  onZoneDrawn,
  zoneDrawError,
  onZoneDrawError,
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

  const { containerRef, beginZoneDraw, isDrawingZone } = useLiveMap({
    assets,
    styleId,
    zones,
    trackDetail,
    selectedAssetId,
    onAssetSelect,
    onZoneDrawn,
    onZoneDrawError,
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
        {zoneDrawError !== null && (
          <span className={styles.error} role="status">
            {zoneDrawError}
          </span>
        )}
      </div>
      {selectedAsset !== null && (
        <AssetInfoPanel
          asset={selectedAsset}
          onClose={() => {
            onAssetSelect(null);
          }}
        />
      )}
    </div>
  );
}
