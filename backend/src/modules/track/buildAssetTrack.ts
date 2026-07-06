import type {
  AssetTrackDetail,
  SelectedTrackDelta,
} from "@dominion-dynamics/shared";
import { getPatrolDroneState } from "../patrol/droneStore.js";
import { getAssetTrackHistory } from "../sim/assetTrackHistory.js";
import { getAssetById } from "../sim/store.js";
import { predictAssetPath } from "../threat/predictPath.js";
import { resolvePredictionLineEnd } from "./resolvePredictionLineEnd.js";
import { shouldShowPredictionLine } from "./shouldShowPredictionLine.js";

function loadTrackContext(assetId: string) {
  const asset = getAssetById(assetId);
  if (!asset) return null;

  const history = getAssetTrackHistory(assetId);

  const shadowTargetId = asset.drone?.patrol?.shadowTargetId;
  const shadowTarget =
    shadowTargetId !== undefined && shadowTargetId !== null
      ? (getAssetById(shadowTargetId) ?? null)
      : null;

  const droneState = getPatrolDroneState(assetId);

  const dispatchTargetId = asset.drone?.dispatch?.targetId;
  const dispatchTarget =
    dispatchTargetId !== undefined && dispatchTargetId.length > 0
      ? (getAssetById(dispatchTargetId) ?? null)
      : null;

  const showPrediction = shouldShowPredictionLine(asset);
  const lineEnd = showPrediction
    ? resolvePredictionLineEnd({
        asset,
        shadowTarget,
        dispatchTarget,
        rejoinTarget: droneState?.rejoinTarget,
      })
    : undefined;

  return {
    asset,
    history,
    predictedPath: predictAssetPath(asset, history, {
      lineEnd,
      hidden: !showPrediction,
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
