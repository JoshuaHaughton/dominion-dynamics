import { useFeedStatusStore } from "../../lib/stores/feedStatusStore.js";
import styles from "./FeedStatus.module.css";

/**
 * Header connection pill. Subscribes to the feed store directly so the 1 Hz
 * snapshot stream re-renders only this component, not the whole App tree.
 */
export function FeedStatus() {
  const connected = useFeedStatusStore((state) => state.connected);
  const lastUpdatedAt = useFeedStatusStore((state) => state.lastUpdatedAt);

  return (
    <div className={styles.feedStatus}>
      <span className={styles.connection} aria-live="polite">
        <span
          className={`${styles.statusDot} ${connected ? styles.statusDotConnected : ""}`}
          aria-hidden="true"
        />
        {connected ? "Live" : "Reconnecting…"}
      </span>
      {lastUpdatedAt !== null ? (
        <span className={styles.statusMuted}>
          Updated {new Date(lastUpdatedAt).toLocaleTimeString()}
        </span>
      ) : null}
    </div>
  );
}
