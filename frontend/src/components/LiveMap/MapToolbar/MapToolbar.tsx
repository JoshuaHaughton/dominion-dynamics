import styles from "./MapToolbar.module.css";

type MapToolbarProps = {
  isDrawingZone: boolean;
  isDrawingPatrol: boolean;
  isSavingPatrolPath: boolean;
  hasPatrolPath: boolean;
  zoneDrawError: string | null;
  patrolDrawError: string | null;
  onBeginZoneDraw: () => void;
  onBeginPatrolDraw: () => void;
  onFocusPatrolRoute: () => void;
};

function resolveDrawHint({
  isDrawingZone,
  isDrawingPatrol,
  isSavingPatrolPath,
}: Pick<
  MapToolbarProps,
  "isDrawingZone" | "isDrawingPatrol" | "isSavingPatrolPath"
>): string | null {
  if (isDrawingZone) {
    return "Click to add points. Close on the first point or press Enter.";
  }

  if (isDrawingPatrol) {
    return "Click to add waypoints. Click the start point to close the loop, or the last point or Enter for an open path.";
  }

  return isSavingPatrolPath ? "Saving patrol path…" : null;
}

/** Floating draw/focus toolbar with contextual hints and draw errors. */
export function MapToolbar({
  isDrawingZone,
  isDrawingPatrol,
  isSavingPatrolPath,
  hasPatrolPath,
  zoneDrawError,
  patrolDrawError,
  onBeginZoneDraw,
  onBeginPatrolDraw,
  onFocusPatrolRoute,
}: MapToolbarProps) {
  const drawHint = resolveDrawHint({
    isDrawingZone,
    isDrawingPatrol,
    isSavingPatrolPath,
  });

  return (
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
            onClick={onBeginZoneDraw}
          >
            Draw restricted zone
          </button>
          <button
            type="button"
            className={`${styles.drawButton} ${isDrawingPatrol ? styles.drawButtonActive : ""}`}
            aria-pressed={isDrawingPatrol}
            onClick={onBeginPatrolDraw}
          >
            Draw patrol path
          </button>
        </div>
        {hasPatrolPath ? (
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
                onClick={onFocusPatrolRoute}
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
        <p className={styles.error} role="alert">
          {zoneDrawError}
        </p>
      ) : null}
      {patrolDrawError !== null ? (
        <p className={styles.error} role="alert">
          {patrolDrawError}
        </p>
      ) : null}
    </div>
  );
}
