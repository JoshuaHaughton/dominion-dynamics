import { useLiveMap, type LiveMapInput } from "./useLiveMap.js";
import styles from "./LiveMap.module.css";

/** MapLibre map with live asset positions from WebSocket snapshots. */
export function LiveMap({ assets, styleId }: LiveMapInput) {
  const { containerRef } = useLiveMap({ assets, styleId });

  return <div ref={containerRef} className={styles.map} />;
}
