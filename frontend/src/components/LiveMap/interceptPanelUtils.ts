import type { Asset, DispatchPhase, DroneOrigin } from "@dominion-dynamics/shared";

export type InterceptMission = {
  droneId: string;
  droneKindLabel: string;
  droneLabel: string;
  focusFieldLabel: string;
  focusLabel: string;
  phase: DispatchPhase;
  phaseLabel: string;
  homeAirportIdent: string;
};

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

export function formatDroneKindLabel(origin: DroneOrigin): string {
  return origin === "dispatch" ? "Airport launch" : "Patrol route";
}

export function formatAirportLabel(
  ident: string,
  name: string | undefined,
): string {
  if (ident.length === 0) {
    return "Unknown";
  }

  if (name !== undefined && name.length > 0) {
    return `${name} (${ident})`;
  }

  return ident;
}

function resolveFocusLabel(
  phase: DispatchPhase,
  targetId: string,
  homeAirportIdent: string,
  homeAirportName: string | undefined,
  assets: readonly Asset[],
): { fieldLabel: string; label: string } {
  if (RTB_PHASES.has(phase)) {
    return {
      fieldLabel: "Returning to",
      label: formatAirportLabel(homeAirportIdent, homeAirportName),
    };
  }

  const targetLabel = resolveAssetLabel(targetId, assets);

  return {
    fieldLabel: "Target",
    label: targetLabel.length > 0 ? targetLabel : "Unknown",
  };
}

/** Active auto-dispatch missions from the latest live asset snapshot. */
export function getActiveInterceptMissions(
  assets: readonly Asset[],
): InterceptMission[] {
  const missions: InterceptMission[] = [];

  for (const asset of assets) {
    const dispatch = asset.drone?.dispatch;

    if (dispatch === undefined) {
      continue;
    }

    const origin = asset.drone?.origin ?? "dispatch";
    const focus = resolveFocusLabel(
      dispatch.phase,
      dispatch.targetId,
      dispatch.homeAirportIdent,
      dispatch.homeAirportName,
      assets,
    );

    missions.push({
      droneId: asset.id,
      droneKindLabel: formatDroneKindLabel(origin),
      droneLabel: resolveAssetLabel(asset.id, assets),
      focusFieldLabel: focus.fieldLabel,
      focusLabel: focus.label,
      phase: dispatch.phase,
      phaseLabel: formatDispatchPhase(dispatch.phase),
      homeAirportIdent: dispatch.homeAirportIdent,
    });
  }

  return missions;
}
