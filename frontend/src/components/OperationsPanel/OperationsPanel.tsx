import { useMemo } from "react";
import type { Asset, ZoneGeoJson } from "@dominion-dynamics/shared";
import type { ZoneView } from "../../lib/hooks/useZones.js";
import {
  statusFiltersForTab,
  type OperationsEntityTab,
  type OperationsStatusFilter,
} from "../../lib/utils/assetSymbology.js";
import {
  buildOperationsRows,
  buildPinnedPatrolRow,
  buildZoneRows,
  countAssetsForTab,
} from "./operationsPanelUtils.js";
import styles from "./OperationsPanel.module.css";

type OperationsPanelProps = {
  assets: readonly Asset[];
  zones: readonly ZoneView[];
  selectedAssetId: string | null;
  entityTab: OperationsEntityTab;
  statusFilter: OperationsStatusFilter;
  onEntityTabChange: (tab: OperationsEntityTab) => void;
  onStatusFilterChange: (filter: OperationsStatusFilter) => void;
  onSelectAsset: (assetId: string) => void;
  onSelectZone: (geojson: ZoneGeoJson) => void;
  onDeleteZone: (zoneId: number) => void;
};

const ENTITY_TABS: readonly {
  id: OperationsEntityTab;
  label: string;
}[] = [
  { id: "missions", label: "Missions" },
  { id: "drones", label: "Drones" },
  { id: "traffic", label: "Traffic" },
  { id: "zones", label: "Zones" },
];

function emptyMessage(entityTab: OperationsEntityTab): string {
  switch (entityTab) {
    case "missions":
      return "No active missions";
    case "drones":
      return "No drones";
    case "traffic":
      return "No traffic";
    case "zones":
      return "No zones";
  }
}

function threatClass(threatLabel: string): string | undefined {
  switch (threatLabel.toLowerCase()) {
    case "critical":
      return styles.threatCritical;
    case "warning":
      return styles.threatWarning;
    case "normal":
      return styles.threatNormal;
    default:
      return undefined;
  }
}

/** Operations panel with entity tabs, status chips, and map-synced row lists. */
export function OperationsPanel({
  assets,
  zones,
  selectedAssetId,
  entityTab,
  statusFilter,
  onEntityTabChange,
  onStatusFilterChange,
  onSelectAsset,
  onSelectZone,
  onDeleteZone,
}: OperationsPanelProps) {
  const rows = useMemo(
      () => buildOperationsRows(assets, entityTab, statusFilter),
      [assets, entityTab, statusFilter],
    );

    const zoneRows = useMemo(() => buildZoneRows(zones), [zones]);

    const pinnedPatrol = useMemo(
      () => (entityTab === "drones" ? buildPinnedPatrolRow(assets) : null),
      [assets, entityTab],
    );

    const statusChips = statusFiltersForTab(entityTab);
    const trafficCount = countAssetsForTab(assets, "traffic");
    const droneCount = countAssetsForTab(assets, "drones");
    const missionCount = countAssetsForTab(assets, "missions");

    return (
      <aside className={styles.panel} aria-label="Operations">
        <div className={styles.header}>
          <h2 className={styles.title}>Operations</h2>
          <p className={styles.summary}>
            {trafficCount} traffic · {droneCount} drones · {missionCount}{" "}
            missions · {zones.length} zones
          </p>
          <div
            className={styles.entityTabs}
            role="tablist"
            aria-label="Entity type"
          >
            {ENTITY_TABS.map((tab) => {
              const count =
                tab.id === "zones"
                  ? zones.length
                  : countAssetsForTab(assets, tab.id);
              const isActive = entityTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={`${styles.entityTab} ${isActive ? styles.entityTabActive : ""}`}
                  onClick={() => {
                    onEntityTabChange(tab.id);
                  }}
                >
                  {tab.label} ({count})
                </button>
              );
            })}
          </div>
          {entityTab !== "zones" ? (
            <div
              className={styles.statusChips}
              role="group"
              aria-label="Status filter"
            >
              {statusChips.map((chip) => {
                const isActive = statusFilter === chip.id;

                return (
                  <button
                    key={chip.id}
                    type="button"
                    aria-pressed={isActive}
                    className={`${styles.statusChip} ${isActive ? styles.statusChipActive : ""}`}
                    onClick={() => {
                      onStatusFilterChange(chip.id);
                    }}
                  >
                    {chip.label}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
        <div className={styles.body}>
          {entityTab === "zones" ? (
            zoneRows.length === 0 ? (
              <p className={styles.empty}>{emptyMessage("zones")}</p>
            ) : (
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
                      <dl className={styles.rowGrid}>
                        <div>
                          <dt>Zone</dt>
                          <dd>{entry.label}</dd>
                        </div>
                        <div>
                          <dt>Status</dt>
                          <dd>{entry.statusLabel}</dd>
                        </div>
                      </dl>
                    </button>
                    {zoneId !== null ? (
                      <button
                        type="button"
                        className={styles.deleteButton}
                        aria-label={`Delete ${entry.label}`}
                        onClick={() => {
                          void onDeleteZone(zoneId);
                        }}
                      >
                        Delete
                      </button>
                    ) : null}
                  </li>
                  );
                })}
              </ul>
            )
          ) : null}
          {entityTab !== "zones" && entityTab === "drones" && pinnedPatrol !== null ? (
            <div className={styles.pinnedSection}>
              <p className={styles.pinnedLabel}>Patrol drone</p>
              <ul className={styles.list}>
                <li>
                  <button
                    type="button"
                    className={`${styles.rowButton} ${styles.pinnedRow} ${selectedAssetId === pinnedPatrol.assetId ? styles.rowButtonSelected : ""}`}
                    aria-pressed={selectedAssetId === pinnedPatrol.assetId}
                    onClick={() => {
                      onSelectAsset(pinnedPatrol.assetId);
                    }}
                  >
                    <dl className={styles.rowGrid}>
                      <div>
                        <dt>Drone</dt>
                        <dd>{pinnedPatrol.row.label}</dd>
                      </div>
                      <div>
                        <dt>Type</dt>
                        <dd>{pinnedPatrol.row.typeLabel}</dd>
                      </div>
                      <div>
                        <dt>Status</dt>
                        <dd>{pinnedPatrol.row.statusLabel}</dd>
                      </div>
                      <div>
                        <dt>Task</dt>
                        <dd>{pinnedPatrol.row.taskLabel}</dd>
                      </div>
                    </dl>
                  </button>
                </li>
              </ul>
            </div>
          ) : null}
          {entityTab !== "zones" &&
          rows.filter((entry) => entry.assetId !== pinnedPatrol?.assetId)
            .length === 0 ? (
            pinnedPatrol === null ? (
              <p className={styles.empty}>{emptyMessage(entityTab)}</p>
            ) : null
          ) : entityTab !== "zones" ? (
            <ul className={styles.list}>
              {rows
                .filter((entry) => entry.assetId !== pinnedPatrol?.assetId)
                .map((entry) => {
                  const isSelected = selectedAssetId === entry.assetId;

                  return (
                    <li key={entry.assetId}>
                      <button
                        type="button"
                        className={`${styles.rowButton} ${isSelected ? styles.rowButtonSelected : ""}`}
                        aria-pressed={isSelected}
                        onClick={() => {
                          onSelectAsset(entry.assetId);
                        }}
                      >
                        {entry.kind === "mission" && (
                          <dl className={styles.rowGrid}>
                            <div>
                              <dt>{entry.row.focusFieldLabel}</dt>
                              <dd>{entry.row.focusLabel}</dd>
                            </div>
                            <div>
                              <dt>Drone</dt>
                              <dd>{entry.row.droneLabel}</dd>
                            </div>
                            <div>
                              <dt>Phase</dt>
                              <dd>{entry.row.phaseLabel}</dd>
                            </div>
                            <div>
                              <dt>Base</dt>
                              <dd>{entry.row.baseLabel}</dd>
                            </div>
                          </dl>
                        )}
                        {entry.kind === "drone" && (
                          <dl className={styles.rowGrid}>
                            <div>
                              <dt>Drone</dt>
                              <dd>{entry.row.label}</dd>
                            </div>
                            <div>
                              <dt>Type</dt>
                              <dd>{entry.row.typeLabel}</dd>
                            </div>
                            <div>
                              <dt>Status</dt>
                              <dd>{entry.row.statusLabel}</dd>
                            </div>
                            <div>
                              <dt>Task</dt>
                              <dd>{entry.row.taskLabel}</dd>
                            </div>
                          </dl>
                        )}
                        {entry.kind === "traffic" && (
                          <dl className={styles.rowGrid}>
                            <div>
                              <dt>Traffic</dt>
                              <dd>{entry.row.label}</dd>
                            </div>
                            <div>
                              <dt>Threat</dt>
                              <dd className={threatClass(entry.row.threatLabel)}>
                                {entry.row.threatLabel}
                              </dd>
                            </div>
                            <div>
                              <dt>TTE</dt>
                              <dd>{entry.row.tteLabel}</dd>
                            </div>
                            <div>
                              <dt>Nearest</dt>
                              <dd>{entry.row.nearestLabel}</dd>
                            </div>
                          </dl>
                        )}
                      </button>
                    </li>
                  );
                })}
            </ul>
          ) : null}
        </div>
      </aside>
    );
}
