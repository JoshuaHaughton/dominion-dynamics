import { useLiveMap, type LiveMapInput } from "./useLiveMap.js";
import styles from "./LiveMap.module.css";

type LiveMapProps = LiveMapInput & {
  zoneDrawError: string | null;
};

/** MapLibre map with live assets and restricted zone drawing. */
export function LiveMap({
  assets,
  styleId,
  zones,
  onZoneDrawn,
  zoneDrawError,
  onZoneDrawError,
}: LiveMapProps) {
  const { containerRef, beginZoneDraw, isDrawingZone } = useLiveMap({
    assets,
    styleId,
    zones,
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
    </div>
  );
}
