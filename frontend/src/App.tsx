import { FeedStatus } from "./components/FeedStatus/FeedStatus.js";
import { LiveMap } from "./components/LiveMap/LiveMap.js";
import { MapLegendModal } from "./components/MapLegend/MapLegendModal.js";
import { MapStyleSelect } from "./components/MapStyleSelect/MapStyleSelect.js";
import { useMapStyle } from "./components/MapStyleSelect/useMapStyle.js";
import styles from "./App.module.css";

export function App() {
  const { styleId, setStyleId } = useMapStyle();

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <h1 className={styles.title}>Dominion Dynamics</h1>
        <div className={styles.headerMeta}>
          <MapLegendModal />
          <MapStyleSelect value={styleId} onChange={setStyleId} />
          <FeedStatus />
        </div>
      </header>
      <main className={styles.main}>
        <div className={styles.mapShell}>
          <LiveMap styleId={styleId} />
        </div>
      </main>
    </div>
  );
}
