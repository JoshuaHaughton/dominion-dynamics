import { setAssets } from "../sim/store.js";
import { enrichAssetsWithThreat } from "../threat/evaluateAsset.js";
import { getCachedZones } from "../threat/zoneGeometryCache.js";
import type { Asset } from "@dominion-dynamics/shared";
import { broadcastSnapshot } from "./ws.server.js";

function buildLiveSnapshot(positions: readonly Asset[]): Asset[] {
  return enrichAssetsWithThreat(positions, getCachedZones());
}

/** Enrich, update the sim store, and push one snapshot to all WS clients. */
export function publishLiveSnapshot(positions: readonly Asset[]): Asset[] {
  const assets = buildLiveSnapshot(positions);

  setAssets(assets);
  broadcastSnapshot(assets);

  return assets;
}
