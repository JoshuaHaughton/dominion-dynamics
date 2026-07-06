import type { Asset, DispatchPhase, DroneOrigin } from "@dominion-dynamics/shared";

export const PATROL_ROUTE_BASE_LABEL = "Patrol route";

const RTB_PHASES = new Set<DispatchPhase>(["rtb", "at_base"]);

/** Shorten synthetic traffic ids for panel display (`syn-…a039`). */
export function formatReadableAssetId(assetId: string): string {
  if (assetId.length <= 16) {
    return assetId;
  }

  const separatorIndex = assetId.indexOf("-");

  if (separatorIndex === -1) {
    return `…${assetId.slice(-8)}`;
  }

  const prefix = assetId.slice(0, separatorIndex);
  const suffix = assetId.slice(-4);

  return `${prefix}-…${suffix}`;
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

export function formatDispatchPhase(phase: DispatchPhase): string {
  switch (phase) {
    case "enroute":
      return "En route";
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
