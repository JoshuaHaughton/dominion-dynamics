import type {
  AssetTrackDetail,
  SelectedTrackDelta,
} from "@dominion-dynamics/shared";
import { getPatrolDroneState } from "../patrol/droneStore.js";
import { resolveChaseSteerPoint } from "../patrol/shadowChase.js";
import { getAssetTrackHistory } from "../sim/assetTrackHistory.js";
import { getAssetById } from "../sim/store.js";
import { predictAssetPath } from "../threat/predictPath.js";

function loadTrackContext(assetId: string) {
  const asset = getAssetById(assetId);
  if (!asset) return null;

  const history = getAssetTrackHistory(assetId);

  const shadowTargetId = asset.drone?.patrol?.shadowTargetId;
  const shadowTarget =
    shadowTargetId !== undefined && shadowTargetId !== null
      ? getAssetById(shadowTargetId)
      : null;

  const droneState = getPatrolDroneState(assetId);

  // Shadow: line to steer point (where the drone aims). Rejoin: line to path snap.
  const shadowLineEnd = shadowTarget
    ? resolveChaseSteerPoint(asset, shadowTarget)
    : null;
  const lineEnd =
    shadowLineEnd ??
    (asset.drone?.patrol?.mode === "rejoin" ? droneState?.rejoinTarget : null) ??
    undefined;

  return {
    asset,
    history,
    predictedPath: predictAssetPath(asset, history, {
      lineEnd,
    }),
  };
}

/** Build history and prediction for one live asset. */
export function getAssetTrackDetail(assetId: string): AssetTrackDetail | null {
  const context = loadTrackContext(assetId);

  if (!context) {
    return null;
  }

  return {
    assetId,
    history: context.history,
    predictedPath: context.predictedPath,
  };
}

/** Build one incremental track update for a synced client. */
export function buildSelectedTrackDelta(
  assetId: string,
): SelectedTrackDelta | null {
  const context = loadTrackContext(assetId);

  if (!context) {
    return null;
  }

  const point = context.history.at(-1);

  if (!point) return null;

  return {
    assetId,
    point,
    predictedPath: context.predictedPath,
  };
}
