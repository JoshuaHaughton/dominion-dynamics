import { LiveMap } from "./components/LiveMap/LiveMap.js";
import { MapStyleSelect } from "./components/MapStyleSelect/MapStyleSelect.js";
import { useLiveAssets } from "./lib/hooks/useLiveAssets.js";
import { useMapStyle } from "./lib/hooks/useMapStyle.js";
import { usePatrolPath } from "./lib/hooks/usePatrolPath.js";
import { useZones } from "./lib/hooks/useZones.js";
import { useOperationsStore } from "./lib/stores/operationsStore.js";
import styles from "./App.module.css";

export function App() {
  const selectedAssetId = useOperationsStore((state) => state.selectedAssetId);
  const { assets, connected, lastUpdatedAt, trackDetail } =
    useLiveAssets(selectedAssetId);
  const { styleId, setStyleId } = useMapStyle();
  const { zones, error: zoneDrawError, addZoneFromDraw, reportDrawError } =
    useZones();
  const {
    patrolPath,
    isSaving: isSavingPatrolPath,
    error: patrolDrawError,
    addPatrolPathFromDraw,
    reportDrawError: reportPatrolDrawError,
  } = usePatrolPath();

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <h1 className={styles.title}>Dominion Dynamics</h1>
        <div className={styles.headerMeta}>
          <span className={styles.connection}>
            <span
              className={`${styles.statusDot} ${connected ? styles.statusDotConnected : ""}`}
              aria-hidden="true"
            />
            {connected ? "Live" : "Reconnecting…"}
          </span>
          <MapStyleSelect value={styleId} onChange={setStyleId} />
          {lastUpdatedAt !== null ? (
            <span className={styles.statusMuted}>
              Updated {new Date(lastUpdatedAt).toLocaleTimeString()}
            </span>
          ) : null}
        </div>
      </header>
      <main className={styles.main}>
        <LiveMap
          assets={assets}
          styleId={styleId}
          zones={zones}
          patrolPath={patrolPath}
          trackDetail={trackDetail}
          onZoneDrawn={addZoneFromDraw}
          onPatrolPathDrawn={addPatrolPathFromDraw}
          onZoneDrawError={reportDrawError}
          onPatrolDrawError={reportPatrolDrawError}
          zoneDrawError={zoneDrawError}
          patrolDrawError={patrolDrawError}
          isSavingPatrolPath={isSavingPatrolPath}
        />
      </main>
    </div>
  );
}
