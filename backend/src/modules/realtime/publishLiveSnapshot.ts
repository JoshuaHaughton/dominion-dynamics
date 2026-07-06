import { getAssetList, isDrone, setAssets } from "../sim/store.js";
import { recordAssetTrackHistory } from "../sim/assetTrackHistory.js";
import { enrichTrafficWithZoneThreat } from "../threat/enrichTrafficWithZoneThreat.js";
import { getCachedZones } from "../threat/zoneGeometryCache.js";
import type { Asset } from "@dominion-dynamics/shared";
import { broadcastSnapshot } from "./ws.server.js";

type PublishLiveSnapshotParams = {
  /** Traffic already enriched with zone threat by the caller. */
  traffic: readonly Asset[];
  drones?: readonly Asset[];
};

/** Merge enriched traffic and drones, then push to the store, history ring, and WS clients. */
export function publishLiveSnapshot({
  traffic,
  drones = [],
}: PublishLiveSnapshotParams): Asset[] {
  const snapshot = [...traffic, ...drones];

  setAssets(snapshot);
  recordAssetTrackHistory(snapshot);
  broadcastSnapshot(snapshot);

  return snapshot;
}

/** Re-enrich stored traffic (zones changed) and keep every drone in the snapshot. */
export function republishLiveSnapshot(): Asset[] {
  const stored = getAssetList();
  const drones = stored.filter(isDrone);
  const traffic = stored.filter((asset) => !isDrone(asset));

  return publishLiveSnapshot({
    traffic: enrichTrafficWithZoneThreat(traffic, getCachedZones()),
    drones,
  });
}
