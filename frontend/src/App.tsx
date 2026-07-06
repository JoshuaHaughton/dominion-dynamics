import { LiveMap } from "./components/LiveMap/LiveMap.js";
import { MapLoadingOverlay } from "./components/LiveMap/MapLoadingOverlay.js";
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
  const {
    zones,
    error: zoneDrawError,
    isLoaded: zonesLoaded,
    addZoneFromDraw,
    removeZone,
    reportDrawError,
  } = useZones();
  const {
    patrolPath,
    isSaving: isSavingPatrolPath,
    isLoaded: patrolPathLoaded,
    error: patrolDrawError,
    addPatrolPathFromDraw,
    reportDrawError: reportPatrolDrawError,
  } = usePatrolPath();

  const isMapReady =
    connected &&
    assets.length > 0 &&
    zonesLoaded &&
    patrolPathLoaded;

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
        <div className={styles.mapShell}>
          <LiveMap
            assets={assets}
            styleId={styleId}
            zones={zones}
            patrolPath={patrolPath}
            trackDetail={trackDetail}
            onZoneDrawn={addZoneFromDraw}
            onPatrolPathDrawn={addPatrolPathFromDraw}
            onZoneDelete={removeZone}
            onZoneDrawError={reportDrawError}
            onPatrolDrawError={reportPatrolDrawError}
            zoneDrawError={zoneDrawError}
            patrolDrawError={patrolDrawError}
            isSavingPatrolPath={isSavingPatrolPath}
          />
          <MapLoadingOverlay visible={!isMapReady} />
        </div>
      </main>
    </div>
  );
}
