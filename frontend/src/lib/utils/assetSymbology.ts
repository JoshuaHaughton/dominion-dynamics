import type {
  Asset,
  DispatchPhase,
  PatrolMode,
  ThreatLevel,
} from "@dominion-dynamics/shared";
import {
  DISPATCH_ACTIVE_PHASES,
  formatDispatchPhase,
  formatOperationsStatusLabel,
  formatPatrolModeLabel,
  formatThreatLabel,
} from "../../components/LiveMap/dispatchDisplayUtils.js";
import {
  ASSET_GHOST_OPACITY,
  ASSET_GHOST_RADIUS_SCALE,
  ASSET_SELECTED_RADIUS_SCALE,
  ASSET_SELECTED_STROKE_WIDTH,
} from "../constants/mapConstants.js";

export type OperationsEntityTab = "missions" | "drones" | "traffic" | "zones";

export type TrafficStatusFilter = "all" | ThreatLevel;
export type DroneStatusFilter =
  | "all"
  | "patrol"
  | "shadow"
  | "rejoin"
  | "enroute"
  | "intercepting"
  | "trailing"
  | "rtb";
export type MissionStatusFilter = DroneStatusFilter;

export type OperationsStatusFilter =
  | TrafficStatusFilter
  | DroneStatusFilter
  | MissionStatusFilter;

export type AssetSymbology =
  | { kind: "traffic"; threat: ThreatLevel }
  | { kind: "patrol"; mode: PatrolMode }
  | {
      kind: "dispatch";
      phase: DispatchPhase;
      divertedFromPatrol: boolean;
    };

/** Panel tab + chip selection that drives row lists and map ghost emphasis. */
export type MapVisualFilter = {
  entityTab: OperationsEntityTab;
  statusFilter: OperationsStatusFilter;
  selectedAssetId: string | null;
};

/** Per-feature map paint emphasis derived from the active operations filter. */
export type AssetMapEmphasis = {
  opacity: number;
  radiusScale: number;
  strokeWidth: number;
};

/** Derive a single symbology descriptor from a wire asset (map + panel). */
export function deriveAssetSymbology(asset: Asset): AssetSymbology {
  if (asset.role === "traffic") {
    return {
      kind: "traffic",
      threat: asset.zone?.threat ?? "normal",
    };
  }

  const dispatch = asset.drone?.dispatch;

  if (dispatch !== undefined) {
    return {
      kind: "dispatch",
      phase: dispatch.phase,
      divertedFromPatrol: asset.drone?.origin === "patrol",
    };
  }

  return {
    kind: "patrol",
    mode: asset.drone?.patrol?.mode ?? "patrol",
  };
}

/** Stable paint key for marker body fill color. */
export function symbologyBodyKey(symbology: AssetSymbology): string {
  switch (symbology.kind) {
    case "traffic":
      return `traffic:${symbology.threat}`;
    case "patrol":
      return `patrol:${symbology.mode}`;
    case "dispatch":
      return `dispatch:${symbology.phase}`;
  }
}

/** Stroke/halo color key for patrol mode or dispatch phase accents. */
export function symbologyStrokeKey(symbology: AssetSymbology): string {
  switch (symbology.kind) {
    case "traffic":
      return "traffic-stroke";
    case "patrol":
      return `patrol-stroke:${symbology.mode}`;
    case "dispatch":
      return `dispatch-stroke:${symbology.phase}`;
  }
}

/** Marker silhouette: circle for traffic, square for all drones. */
export function symbologyMarkerShape(
  symbology: AssetSymbology,
): "circle" | "square" {
  switch (symbology.kind) {
    case "traffic":
      return "circle";
    case "patrol":
    case "dispatch":
      return "square";
  }
}

function matchesTrafficFilter(
  symbology: AssetSymbology,
  statusFilter: TrafficStatusFilter,
): boolean {
  if (symbology.kind !== "traffic") {
    return false;
  }

  return statusFilter === "all" || symbology.threat === statusFilter;
}

function matchesDroneFilter(
  asset: Asset,
  symbology: AssetSymbology,
  statusFilter: DroneStatusFilter,
): boolean {
  if (asset.role !== "drone") {
    return false;
  }

  if (statusFilter === "all") {
    return true;
  }

  if (symbology.kind === "patrol") {
    return statusFilter === symbology.mode;
  }

  if (symbology.kind === "dispatch") {
    return statusFilter === symbology.phase;
  }

  return false;
}

function matchesMissionFilter(
  asset: Asset,
  symbology: AssetSymbology,
  statusFilter: MissionStatusFilter,
): boolean {
  if (symbology.kind !== "dispatch" || asset.drone?.dispatch === undefined) {
    return false;
  }

  if (statusFilter === "all") {
    return DISPATCH_ACTIVE_PHASES.has(symbology.phase);
  }

  return symbology.phase === statusFilter;
}

/** Whether an asset belongs to the active entity tab. */
export function assetMatchesEntityTab(
  asset: Asset,
  entityTab: OperationsEntityTab,
): boolean {
  switch (entityTab) {
    case "traffic":
      return asset.role === "traffic";
    case "drones":
      return asset.role === "drone";
    case "missions":
      return asset.drone?.dispatch !== undefined;
    case "zones":
      return false;
  }
}

/** Whether an asset matches the contextual status chip within its tab. */
export function assetMatchesStatusFilter(
  asset: Asset,
  entityTab: OperationsEntityTab,
  statusFilter: OperationsStatusFilter,
): boolean {
  const symbology = deriveAssetSymbology(asset);

  switch (entityTab) {
    case "traffic":
      return matchesTrafficFilter(symbology, statusFilter as TrafficStatusFilter);
    case "drones":
      return matchesDroneFilter(asset, symbology, statusFilter as DroneStatusFilter);
    case "missions":
      return matchesMissionFilter(
        asset,
        symbology,
        statusFilter as MissionStatusFilter,
      );
    case "zones":
      return false;
  }
}

/** Panel row visibility for the active tab + status chip. */
export function assetMatchesOperationsFilter(
  asset: Asset,
  entityTab: OperationsEntityTab,
  statusFilter: OperationsStatusFilter,
): boolean {
  return (
    assetMatchesEntityTab(asset, entityTab) &&
    assetMatchesStatusFilter(asset, entityTab, statusFilter)
  );
}

function assetMatchesActiveFilter(
  asset: Asset,
  filter: MapVisualFilter,
): boolean {
  if (filter.statusFilter === "all") {
    return true;
  }

  return assetMatchesOperationsFilter(
    asset,
    filter.entityTab,
    filter.statusFilter,
  );
}

/**
 * Ghost de-emphasis for non-matching assets when a specific chip is active.
 * All chip and selected assets always render at full strength.
 */
export function mapEmphasisForAsset(
  asset: Asset,
  filter: MapVisualFilter,
  ghostOpacity: number = ASSET_GHOST_OPACITY,
  ghostRadiusScale: number = ASSET_GHOST_RADIUS_SCALE,
): AssetMapEmphasis {
  const isSelected = asset.id === filter.selectedAssetId;
  const fullEmphasis: AssetMapEmphasis = {
    opacity: 1,
    radiusScale: isSelected ? ASSET_SELECTED_RADIUS_SCALE : 1,
    strokeWidth: isSelected ? ASSET_SELECTED_STROKE_WIDTH : 1,
  };

  if (
    filter.entityTab === "zones" ||
    filter.statusFilter === "all" ||
    filter.selectedAssetId === asset.id ||
    assetMatchesActiveFilter(asset, filter)
  ) {
    return fullEmphasis;
  }

  return {
    opacity: ghostOpacity,
    radiusScale: ghostRadiusScale,
    strokeWidth: 0.5,
  };
}

export function statusFiltersForTab(
  entityTab: OperationsEntityTab,
): readonly { id: OperationsStatusFilter; label: string }[] {
  switch (entityTab) {
    case "traffic":
      return [
        { id: "all", label: "All" },
        { id: "critical", label: formatThreatLabel("critical") },
        { id: "warning", label: formatThreatLabel("warning") },
        { id: "normal", label: formatThreatLabel("normal") },
      ];
    case "drones":
      return [
        { id: "all", label: "All" },
        { id: "patrol", label: formatPatrolModeLabel("patrol") },
        { id: "shadow", label: formatPatrolModeLabel("shadow") },
        { id: "rejoin", label: formatPatrolModeLabel("rejoin") },
        { id: "enroute", label: formatOperationsStatusLabel("enroute") },
        { id: "intercepting", label: formatOperationsStatusLabel("intercepting") },
        { id: "trailing", label: formatOperationsStatusLabel("trailing") },
        { id: "rtb", label: formatOperationsStatusLabel("rtb") },
      ];
    case "missions":
      return [
        { id: "all", label: "All" },
        { id: "enroute", label: formatDispatchPhase("enroute") },
        { id: "intercepting", label: formatDispatchPhase("intercepting") },
        { id: "trailing", label: formatDispatchPhase("trailing") },
        { id: "rtb", label: formatDispatchPhase("rtb") },
      ];
    case "zones":
      return [{ id: "all", label: "All" }];
  }
}
