import styles from "./MapLoadingOverlay.module.css";

type MapLoadingOverlayProps = {
  visible: boolean;
};

/** Covers the map until live assets and persisted geometry have loaded. */
export function MapLoadingOverlay({ visible }: MapLoadingOverlayProps) {
  if (!visible) {
    return null;
  }

  return (
    <div className={styles.overlay} aria-live="polite" aria-busy="true">
      <p className={styles.message}>Connecting to live feed…</p>
    </div>
  );
}
