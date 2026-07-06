import { AnimatePresence, motion } from "framer-motion";
import type { Asset } from "@dominion-dynamics/shared";
import {
  statusFiltersForTab,
  type OperationsEntityTab,
  type OperationsStatusFilter,
} from "../../lib/utils/assetSymbology.js";
import { useFadeMotionProps } from "../../lib/motion/useFadeMotion.js";
import { countAssetsForTab } from "./operationsPanelUtils.js";
import styles from "./OperationsPanel.module.css";

type OperationsPanelHeaderProps = {
  assets: readonly Asset[];
  zoneCount: number;
  entityTab: OperationsEntityTab;
  statusFilter: OperationsStatusFilter;
  onEntityTabChange: (tab: OperationsEntityTab) => void;
  onStatusFilterChange: (filter: OperationsStatusFilter) => void;
};

const ENTITY_TABS: readonly {
  id: OperationsEntityTab;
  label: string;
}[] = [
  { id: "traffic", label: "Traffic" },
  { id: "drones", label: "Drones" },
  { id: "missions", label: "Missions" },
  { id: "zones", label: "Zones" },
];

/** Panel title, live counts summary, entity tabs, and status filter chips. */
export function OperationsPanelHeader({
  assets,
  zoneCount,
  entityTab,
  statusFilter,
  onEntityTabChange,
  onStatusFilterChange,
}: OperationsPanelHeaderProps) {
  const fadeMotion = useFadeMotionProps();
  const statusChips = statusFiltersForTab(entityTab);
  const trafficCount = countAssetsForTab(assets, "traffic");
  const droneCount = countAssetsForTab(assets, "drones");
  const missionCount = countAssetsForTab(assets, "missions");

  return (
    <div className={styles.header}>
      <h2 className={styles.title}>Operations</h2>
      <p className={styles.summary}>
        {trafficCount} traffic · {droneCount} drones · {missionCount} missions ·{" "}
        {zoneCount} zones
      </p>
      {/* Toggle group instead of APG tabs: honest semantics without the
          aria-controls/tabpanel/roving-focus machinery tabs would require. */}
      <div className={styles.entityTabs} role="group" aria-label="Entity type">
        {ENTITY_TABS.map((tab) => {
          const count =
            tab.id === "zones" ? zoneCount : countAssetsForTab(assets, tab.id);
          const isActive = entityTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              aria-pressed={isActive}
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
      <AnimatePresence initial={false}>
        {entityTab !== "zones" ? (
          <motion.div
            key="status-chips"
            className={styles.statusChips}
            role="group"
            aria-label="Status filter"
            {...fadeMotion}
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
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
