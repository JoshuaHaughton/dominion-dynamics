import type {
  Asset,
  DispatchPhase,
  DroneOrigin,
  PatrolMode,
  ThreatLevel,
} from "@dominion-dynamics/shared";

export const PATROL_ROUTE_BASE_LABEL = "Patrol route";

/** Phases shown in the missions tab when the status chip is All. */
export const DISPATCH_ACTIVE_PHASES = new Set<DispatchPhase>([
  "enroute",
  "intercepting",
  "trailing",
  "rtb",
]);

const RTB_PHASES = new Set<DispatchPhase>(["rtb", "at_base"]);

export type DispatchMissionRow = {
  assetId: string;
  droneLabel: string;
  focusFieldLabel: string;
  focusLabel: string;
  phaseLabel: string;
  baseLabel: string;
};

/** Shorten opaque asset ids when no callsign is available. */
export function formatReadableAssetId(assetId: string): string {
  if (assetId.length <= 16) {
    return assetId;
  }

  return `…${assetId.slice(-6)}`;
}

/** Resolve a traffic or drone id to callsign when present, else a shortened id. */
export function resolveAssetLabel(
  assetId: string,
  assets: readonly Asset[],
): string {
  if (assetId.length === 0) {
    return "";
  }

  const asset = assets.find((candidate) => candidate.id === assetId);

  if (asset?.callsign !== null && asset?.callsign !== undefined) {
    return asset.callsign;
  }

  return formatReadableAssetId(assetId);
}

/** Operator-facing dispatch phase label shared by panels, chips, and detail views. */
export function formatDispatchPhase(phase: DispatchPhase): string {
  switch (phase) {
    case "enroute":
      return "En-route";
    case "intercepting":
      return "Intercepting";
    case "trailing":
      return "Trailing";
    case "rtb":
      return "RTB";
    case "at_base":
      return "At base";
  }
}

/** Patrol tasking label for operations panel rows and status chips. */
export function formatPatrolModeLabel(mode: PatrolMode): string {
  switch (mode) {
    case "shadow":
      return "Shadowing";
    case "rejoin":
      return "Rejoining";
    case "patrol":
      return "On route";
  }
}

/** Status chip label for a drone/mission filter id (falls back to dispatch phase labels). */
export function formatOperationsStatusLabel(
  statusFilter:
    | "patrol"
    | "shadow"
    | "rejoin"
    | "enroute"
    | "intercepting"
    | "trailing"
    | "rtb",
): string {
  switch (statusFilter) {
    case "patrol":
    case "shadow":
    case "rejoin":
      return formatPatrolModeLabel(statusFilter);
    case "enroute":
    case "intercepting":
    case "trailing":
    case "rtb":
      return formatDispatchPhase(statusFilter);
  }
}

export function formatThreatLabel(threat: ThreatLevel): string {
  return threat.charAt(0).toUpperCase() + threat.slice(1);
}

/** Seconds until intercept for dispatch drone detail panels. */
export function formatInterceptEtaSeconds(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined) {
    return "—";
  }

  return formatZoneTteSeconds(seconds);
}

/** Zone time-to-entry for operations and detail panels. */
export function formatZoneTteSeconds(seconds: number | null): string {
  if (seconds === null) {
    return "—";
  }

  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainder = Math.round(seconds % 60);

  return remainder > 0 ? `${minutes}m ${remainder}s` : `${minutes}m`;
}

/** Nearest restricted-zone boundary distance for operations rows. */
export function formatNearestZoneDistance(distanceM: number | null): string {
  if (distanceM === null) {
    return "No zones";
  }

  if (distanceM === 0) {
    return "Inside zone";
  }

  if (distanceM >= 1000) {
    return `${(distanceM / 1000).toFixed(1)} km`;
  }

  return `${Math.round(distanceM)} m`;
}

export function formatDispatchBaseLabel(
  origin: DroneOrigin,
  homeAirportIdent: string,
): string {
  if (origin === "patrol") {
    return PATROL_ROUTE_BASE_LABEL;
  }

  return homeAirportIdent.length > 0 ? homeAirportIdent : "Unknown";
}

export function formatDispatchFocusField(
  phase: DispatchPhase,
): "Target" | "Returning to" {
  return RTB_PHASES.has(phase) ? "Returning to" : "Target";
}

export function formatDispatchFocusValue(
  phase: DispatchPhase,
  targetId: string,
  homeAirportIdent: string,
  assets: readonly Asset[],
  origin?: DroneOrigin,
): string {
  if (RTB_PHASES.has(phase)) {
    if (origin === "patrol") {
      return PATROL_ROUTE_BASE_LABEL;
    }

    return homeAirportIdent.length > 0 ? homeAirportIdent : "Unknown";
  }

  const targetLabel = resolveAssetLabel(targetId, assets);

  return targetLabel.length > 0 ? targetLabel : "Unknown";
}

/** Build the shared mission row fields used by the operations panel. */
export function buildDispatchMissionRow(
  asset: Asset,
  assets: readonly Asset[],
): DispatchMissionRow | null {
  const dispatch = asset.drone?.dispatch;

  if (dispatch === undefined) {
    return null;
  }

  const origin = asset.drone?.origin ?? "dispatch";

  return {
    assetId: asset.id,
    droneLabel: resolveAssetLabel(asset.id, assets),
    focusFieldLabel: formatDispatchFocusField(dispatch.phase),
    focusLabel: formatDispatchFocusValue(
      dispatch.phase,
      dispatch.targetId,
      dispatch.homeAirportIdent,
      assets,
      origin,
    ),
    phaseLabel: formatDispatchPhase(dispatch.phase),
    baseLabel: formatDispatchBaseLabel(origin, dispatch.homeAirportIdent),
  };
}
