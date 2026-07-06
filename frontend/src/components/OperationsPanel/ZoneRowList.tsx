import type { ZoneGeoJson } from "@dominion-dynamics/shared";
import type { ZoneRow } from "./operationsPanelUtils.js";
import dlStyles from "../../styles/dlGrid.module.css";
import styles from "./OperationsPanel.module.css";

type ZoneRowListProps = {
  zoneRows: readonly ZoneRow[];
  onSelectZone: (geojson: ZoneGeoJson) => void;
  onDeleteZone: (zoneId: number) => void;
};

/** Zone rows with focus-on-click and per-zone delete. */
export function ZoneRowList({
  zoneRows,
  onSelectZone,
  onDeleteZone,
}: ZoneRowListProps) {
  return (
    <ul className={styles.list}>
      {zoneRows.map((entry) => {
        const zoneId = entry.zoneId;

        return (
          <li key={entry.key} className={styles.zoneRow}>
            <button
              type="button"
              className={styles.rowButton}
              onClick={() => {
                onSelectZone(entry.geojson);
              }}
            >
              <span className={styles.rowGrid}>
                <span>
                  <span className={dlStyles.dlLabel}>Zone</span>
                  <span className={dlStyles.dlValue}>{entry.label}</span>
                </span>
                <span>
                  <span className={dlStyles.dlLabel}>Status</span>
                  <span className={dlStyles.dlValue}>{entry.statusLabel}</span>
                </span>
              </span>
            </button>
            {zoneId !== null ? (
              <button
                type="button"
                className={styles.deleteButton}
                aria-label={`Delete ${entry.label}`}
                onClick={() => {
                  onDeleteZone(zoneId);
                }}
              >
                Delete
              </button>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
