import { AnimatePresence, motion } from "framer-motion";
import { useFadeMotionProps } from "../../../lib/motion/useFadeMotion.js";
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
  const fadeMotion = useFadeMotionProps();
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
        <AnimatePresence initial={false}>
          {hasPatrolPath ? (
            <motion.div
              key="focus-patrol"
              className={styles.focusGroupWrap}
              {...fadeMotion}
            >
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
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
      <AnimatePresence initial={false}>
        {drawHint !== null ? (
          <motion.p
            key="draw-hint"
            className={styles.drawHint}
            role="status"
            {...fadeMotion}
          >
            {drawHint}
          </motion.p>
        ) : null}
        {zoneDrawError !== null ? (
          <motion.p
            key="zone-error"
            className={styles.error}
            role="alert"
            {...fadeMotion}
          >
            {zoneDrawError}
          </motion.p>
        ) : null}
        {patrolDrawError !== null ? (
          <motion.p
            key="patrol-error"
            className={styles.error}
            role="alert"
            {...fadeMotion}
          >
            {patrolDrawError}
          </motion.p>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
