import { LiveMap } from "./components/LiveMap/LiveMap.js";
import { MapStyleSelect } from "./components/MapStyleSelect/MapStyleSelect.js";
import { useLiveAssets } from "./lib/hooks/useLiveAssets.js";
import { useMapStyle } from "./lib/hooks/useMapStyle.js";
import styles from "./App.module.css";

export function App() {
  const { assets, connected, lastUpdatedAt } = useLiveAssets();
  const { styleId, setStyleId } = useMapStyle();

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <h1 className={styles.title}>Dominion Dynamics</h1>
        <div className={styles.status}>
          <MapStyleSelect value={styleId} onChange={setStyleId} />
          <span
            className={`${styles.statusDot} ${connected ? styles.statusDotConnected : ""}`}
          />
          <span>{connected ? "Live" : "Reconnecting…"}</span>
          <span>{assets.length} assets</span>
          {lastUpdatedAt !== null && (
            <span className={styles.statusMuted}>
              updated {new Date(lastUpdatedAt).toLocaleTimeString()}
            </span>
          )}
        </div>
      </header>
      <main className={styles.main}>
        <LiveMap assets={assets} styleId={styleId} />
      </main>
    </div>
  );
}
