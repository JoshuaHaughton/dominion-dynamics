import { useState } from "react";
import { LiveMap } from "./components/LiveMap/LiveMap.js";
import { MapStyleSelect } from "./components/MapStyleSelect/MapStyleSelect.js";
import { useLiveAssets } from "./lib/hooks/useLiveAssets.js";
import { useMapStyle } from "./lib/hooks/useMapStyle.js";
import { usePatrolPath } from "./lib/hooks/usePatrolPath.js";
import { useZones } from "./lib/hooks/useZones.js";
import styles from "./App.module.css";

export function App() {
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [isFollowingCamera, setIsFollowingCamera] = useState(false);
  const [patrolFocusRequest, setPatrolFocusRequest] = useState(0);
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
        <div className={styles.status}>
          <MapStyleSelect value={styleId} onChange={setStyleId} />
          <span
            className={`${styles.statusDot} ${connected ? styles.statusDotConnected : ""}`}
          />
          <span>{connected ? "Live" : "Reconnecting…"}</span>
          <span>{assets.length} assets</span>
          <span>{zones.length} zones</span>
          {patrolPath !== null ? (
            <button
              type="button"
              className={styles.statusButton}
              onClick={() => {
                setPatrolFocusRequest((count) => count + 1);
              }}
            >
              Patrol route saved
            </button>
          ) : (
            <span>No patrol route</span>
          )}
          {lastUpdatedAt !== null && (
            <span className={styles.statusMuted}>
              updated {new Date(lastUpdatedAt).toLocaleTimeString()}
            </span>
          )}
        </div>
      </header>
      <main className={styles.main}>
        <LiveMap
          assets={assets}
          styleId={styleId}
          zones={zones}
          patrolPath={patrolPath}
          selectedAssetId={selectedAssetId}
          isFollowingCamera={isFollowingCamera}
          patrolFocusRequest={patrolFocusRequest}
          trackDetail={trackDetail}
          onAssetSelect={setSelectedAssetId}
          onFollowingChange={setIsFollowingCamera}
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
