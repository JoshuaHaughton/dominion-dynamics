import type {
  AssetTrackDetail,
  SelectedTrackDelta,
} from "@dominion-dynamics/shared";
import { getAssetTrackHistory } from "../sim/assetTrackHistory.js";
import { getAssetById } from "../sim/store.js";
import { predictAssetPath } from "../threat/predictPath.js";

/** Build history and prediction for one live asset. */
export function getAssetTrackDetail(assetId: string): AssetTrackDetail | null {
  const asset = getAssetById(assetId);

  if (!asset) {
    return null;
  }

  const history = getAssetTrackHistory(assetId);

  return {
    assetId,
    history,
    predictedPath: predictAssetPath(asset, history),
  };
}

/** Build one incremental track update for a synced client. */
export function buildSelectedTrackDelta(
  assetId: string,
): SelectedTrackDelta | null {
  const asset = getAssetById(assetId);

  if (!asset) {
    return null;
  }

  const history = getAssetTrackHistory(assetId);
  const point = history.at(-1);

  if (!point) return null;

  return {
    assetId,
    point,
    predictedPath: predictAssetPath(asset, history),
  };
}
