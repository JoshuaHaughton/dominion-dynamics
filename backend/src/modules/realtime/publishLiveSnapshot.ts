import { getAssetList, setAssets } from "../sim/store.js";
import { enrichAssetsWithThreat } from "../threat/evaluateAsset.js";
import { getCachedZones } from "../threat/zoneGeometryCache.js";
import type { Asset } from "@dominion-dynamics/shared";
import { broadcastSnapshot } from "./ws.server.js";

/** Enrich positions with zone threat and persist to the sim store. */
export function buildLiveSnapshot(
  positions: readonly Asset[],
): Asset[] {
  return enrichAssetsWithThreat(positions, getCachedZones());
}

/** Enrich, update the sim store, and push one snapshot to all WS clients. */
export function publishLiveSnapshot(positions?: readonly Asset[]): Asset[] {
  const input = positions ?? getAssetList();
  const assets = buildLiveSnapshot(input);

  setAssets(assets);
  broadcastSnapshot(assets);

  return assets;
}
