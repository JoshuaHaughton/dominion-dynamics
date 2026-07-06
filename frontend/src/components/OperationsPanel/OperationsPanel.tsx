import { useMemo } from "react";
import type { Asset, ZoneGeoJson } from "@dominion-dynamics/shared";
import type { ZoneView } from "../LiveMap/zones/useZones.js";
import type {
  OperationsEntityTab,
  OperationsStatusFilter,
} from "../../lib/utils/assetSymbology.js";
import {
  buildOperationsRows,
  buildPinnedPatrolRow,
  buildZoneRows,
  type DroneRow,
  type OperationsRow,
} from "./operationsPanelUtils.js";
import {
  OperationsAssetRow,
  type AssetRowField,
} from "./OperationsAssetRow.js";
import { OperationsPanelHeader } from "./OperationsPanelHeader.js";
import { ZoneRowList } from "./ZoneRowList.js";
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

function droneRowFields(row: DroneRow): AssetRowField[] {
  return [
    { label: "Drone", value: row.label },
    { label: "Type", value: row.typeLabel },
    { label: "Status", value: row.statusLabel },
    { label: "Task", value: row.taskLabel },
  ];
}

function rowFields(entry: OperationsRow): AssetRowField[] {
  switch (entry.kind) {
    case "mission":
      return [
        { label: entry.row.focusFieldLabel, value: entry.row.focusLabel },
        { label: "Drone", value: entry.row.droneLabel },
        { label: "Phase", value: entry.row.phaseLabel },
        { label: "Base", value: entry.row.baseLabel },
      ];
    case "drone":
      return droneRowFields(entry.row);
    case "traffic":
      return [
        { label: "Traffic", value: entry.row.label },
        {
          label: "Threat",
          value: entry.row.threatLabel,
          valueClassName: threatClass(entry.row.threatLabel),
        },
        { label: "TTE", value: entry.row.tteLabel },
        { label: "Nearest", value: entry.row.nearestLabel },
      ];
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

  const listRows = rows.filter(
    (entry) => entry.assetId !== pinnedPatrol?.assetId,
  );

  return (
    <aside className={styles.panel} aria-label="Operations">
      <OperationsPanelHeader
        assets={assets}
        zoneCount={zones.length}
        entityTab={entityTab}
        statusFilter={statusFilter}
        onEntityTabChange={onEntityTabChange}
        onStatusFilterChange={onStatusFilterChange}
      />
      <div className={styles.body}>
        {entityTab === "zones" ? (
          zoneRows.length === 0 ? (
            <p className={styles.empty}>{emptyMessage("zones")}</p>
          ) : (
            <ZoneRowList
              zoneRows={zoneRows}
              onSelectZone={onSelectZone}
              onDeleteZone={onDeleteZone}
            />
          )
        ) : (
          <>
            {pinnedPatrol !== null ? (
              <div className={styles.pinnedSection}>
                <p className={styles.pinnedLabel}>Patrol drone</p>
                <ul className={styles.list}>
                  <OperationsAssetRow
                    assetId={pinnedPatrol.assetId}
                    fields={droneRowFields(pinnedPatrol.row)}
                    isSelected={selectedAssetId === pinnedPatrol.assetId}
                    isPinned
                    onSelect={onSelectAsset}
                  />
                </ul>
              </div>
            ) : null}
            {listRows.length === 0 ? (
              pinnedPatrol === null ? (
                <p className={styles.empty}>{emptyMessage(entityTab)}</p>
              ) : null
            ) : (
              <ul className={styles.list}>
                {listRows.map((entry) => (
                  <OperationsAssetRow
                    key={entry.assetId}
                    assetId={entry.assetId}
                    fields={rowFields(entry)}
                    isSelected={selectedAssetId === entry.assetId}
                    onSelect={onSelectAsset}
                  />
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </aside>
  );
}
