import type { Asset, ZoneGeoJson } from "@dominion-dynamics/shared";
import { PATROL_ASSET_ID } from "@dominion-dynamics/shared";
import type { ZoneView } from "../LiveMap/zones/useZones.js";
import { isPendingZone } from "../LiveMap/zones/useZones.js";
import {
  assetMatchesEntityTab,
  assetMatchesOperationsFilter,
  type OperationsEntityTab,
  type OperationsStatusFilter,
} from "../../lib/utils/assetSymbology.js";
import {
  buildDispatchMissionRow,
  formatDispatchFocusValue,
  formatDispatchPhase,
  formatNearestZoneDistance,
  formatPatrolModeLabel,
  formatThreatLabel,
  formatZoneTteSeconds,
  PATROL_ROUTE_BASE_LABEL,
  resolveAssetLabel,
  type DispatchMissionRow,
} from "../../lib/display/dispatchDisplayUtils.js";

export type MissionRow = DispatchMissionRow;

export type DroneRow = {
  assetId: string;
  label: string;
  typeLabel: string;
  statusLabel: string;
  taskLabel: string;
};

export type TrafficRow = {
  assetId: string;
  label: string;
  threatLabel: string;
  tteLabel: string;
  nearestLabel: string;
};

export type OperationsRow =
  | { kind: "mission"; assetId: string; row: MissionRow }
  | { kind: "drone"; assetId: string; row: DroneRow }
  | { kind: "traffic"; assetId: string; row: TrafficRow };

function buildDroneRow(asset: Asset, assets: readonly Asset[]): DroneRow {
  const dispatch = asset.drone?.dispatch;
  const patrol = asset.drone?.patrol;
  const origin = asset.drone?.origin ?? "dispatch";

  if (dispatch !== undefined) {
    return {
      assetId: asset.id,
      label: resolveAssetLabel(asset.id, assets),
      typeLabel: origin === "patrol" ? "Patrol → dispatch" : "Dispatch",
      statusLabel: formatDispatchPhase(dispatch.phase),
      taskLabel: formatDispatchFocusValue(
        dispatch.phase,
        dispatch.targetId,
        dispatch.homeAirportIdent,
        assets,
        origin,
      ),
    };
  }

  const mode = patrol?.mode ?? "patrol";

  return {
    assetId: asset.id,
    label: resolveAssetLabel(asset.id, assets),
    typeLabel: "Patrol",
    statusLabel: formatPatrolModeLabel(mode),
    taskLabel:
      mode === "shadow" && patrol?.shadowTargetId
        ? resolveAssetLabel(patrol.shadowTargetId, assets)
        : mode === "patrol"
          ? PATROL_ROUTE_BASE_LABEL
          : "Return to route",
  };
}

function buildTrafficRow(asset: Asset, assets: readonly Asset[]): TrafficRow {
  const zone = asset.zone;

  return {
    assetId: asset.id,
    label: resolveAssetLabel(asset.id, assets),
    threatLabel: formatThreatLabel(zone?.threat ?? "normal"),
    tteLabel: formatZoneTteSeconds(zone?.zoneTteSeconds ?? null),
    nearestLabel: formatNearestZoneDistance(zone?.nearestBoundaryM ?? null),
  };
}

/** The singleton patrol drone asset when present in the live snapshot. */
export function findPatrolDroneAsset(assets: readonly Asset[]): Asset | null {
  const patrol = assets.find((asset) => asset.id === PATROL_ASSET_ID);

  if (patrol?.role !== "drone") {
    return null;
  }

  return patrol;
}

export type ZoneRow = {
  key: string;
  label: string;
  statusLabel: string;
  geojson: ZoneGeoJson;
  zoneId: number | null;
};

export function buildZoneRows(zones: readonly ZoneView[]): ZoneRow[] {
  return zones.map((zone) => {
    if (isPendingZone(zone)) {
      return {
        key: zone.clientId,
        label: zone.name,
        statusLabel: "Saving…",
        geojson: zone.geojson,
        zoneId: null,
      };
    }

    return {
      key: String(zone.id),
      label: zone.name,
      statusLabel: "Active",
      geojson: zone.geojson,
      zoneId: zone.id,
    };
  });
}

export function countAssetsForTab(
  assets: readonly Asset[],
  entityTab: OperationsEntityTab,
): number {
  if (entityTab === "zones") {
    return 0;
  }

  return assets.filter((asset) => assetMatchesEntityTab(asset, entityTab))
    .length;
}

export function buildOperationsRows(
  assets: readonly Asset[],
  entityTab: OperationsEntityTab,
  statusFilter: OperationsStatusFilter,
): OperationsRow[] {
  const rows: OperationsRow[] = [];

  for (const asset of assets) {
    if (!assetMatchesOperationsFilter(asset, entityTab, statusFilter)) {
      continue;
    }

    if (entityTab === "missions") {
      const missionRow = buildDispatchMissionRow(asset, assets);

      if (missionRow !== null) {
        rows.push({
          kind: "mission",
          assetId: asset.id,
          row: missionRow,
        });
      }
      continue;
    }

    if (entityTab === "drones" && asset.role === "drone") {
      rows.push({
        kind: "drone",
        assetId: asset.id,
        row: buildDroneRow(asset, assets),
      });
      continue;
    }

    if (entityTab === "traffic" && asset.role === "traffic") {
      rows.push({
        kind: "traffic",
        assetId: asset.id,
        row: buildTrafficRow(asset, assets),
      });
    }
  }

  return rows;
}

/** Pinned patrol row for the drones tab (always shown when the patrol asset exists). */
export function buildPinnedPatrolRow(
  assets: readonly Asset[],
): { assetId: string; row: DroneRow } | null {
  const patrol = findPatrolDroneAsset(assets);

  if (patrol === null) {
    return null;
  }

  return {
    assetId: patrol.id,
    row: buildDroneRow(patrol, assets),
  };
}
