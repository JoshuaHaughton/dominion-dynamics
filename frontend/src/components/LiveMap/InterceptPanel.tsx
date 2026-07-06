import { useMemo } from "react";
import type { Asset } from "@dominion-dynamics/shared";
import { getActiveInterceptMissions } from "./interceptPanelUtils.js";
import styles from "./InterceptPanel.module.css";

type InterceptPanelProps = {
  assets: readonly Asset[];
  selectedAssetId: string | null;
  onSelectDrone: (droneId: string) => void;
};

/** Read-only queue of active auto-dispatch missions; row click selects the assigned drone. */
export function InterceptPanel({
  assets,
  selectedAssetId,
  onSelectDrone,
}: InterceptPanelProps) {
  const missions = useMemo(
    () => getActiveInterceptMissions(assets),
    [assets],
  );

  return (
    <aside className={styles.panel} aria-label="Active intercept missions">
      <div className={styles.header}>
        <h2 className={styles.title}>Active intercepts</h2>
        <span className={styles.count} aria-live="polite">
          {missions.length}
        </span>
      </div>
      <div className={styles.body}>
        {missions.length === 0 ? (
          <p className={styles.empty}>No active intercepts</p>
        ) : (
          <ul className={styles.list}>
            {missions.map((mission) => {
              const isSelected = selectedAssetId === mission.droneId;

              return (
                <li key={mission.droneId}>
                  <button
                    type="button"
                    className={`${styles.missionButton} ${isSelected ? styles.missionButtonSelected : ""}`}
                    aria-pressed={isSelected}
                    onClick={() => {
                      onSelectDrone(mission.droneId);
                    }}
                  >
                    <dl className={styles.missionGrid}>
                      <div>
                        <dt>{mission.focusFieldLabel}</dt>
                        <dd>{mission.focusLabel}</dd>
                      </div>
                      <div>
                        <dt>Drone</dt>
                        <dd>
                          {mission.droneKindLabel} · {mission.droneLabel}
                        </dd>
                      </div>
                      <div>
                        <dt>Phase</dt>
                        <dd>{mission.phaseLabel}</dd>
                      </div>
                      <div>
                        <dt>Base</dt>
                        <dd>{mission.homeAirportIdent}</dd>
                      </div>
                    </dl>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}
