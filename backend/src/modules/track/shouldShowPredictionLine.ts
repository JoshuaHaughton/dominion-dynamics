import type { Asset } from "@dominion-dynamics/shared";

/** Whether the selected-asset prediction overlay should render for this snapshot. */
export function shouldShowPredictionLine(asset: Asset): boolean {
  if (asset.speed <= 0) {
    return false;
  }

  const dispatch = asset.drone?.dispatch;

  if (dispatch?.phase === "at_base") {
    return false;
  }

  // Saved patrol route is already drawn on the map; skip redundant forward line.
  if (asset.drone?.patrol?.mode === "patrol" && dispatch === undefined) {
    return false;
  }

  return true;
}
