import { getAssetList, isDrone, setAssets } from "../sim/store.js";
import { recordAssetTrackHistory } from "../sim/assetTrackHistory.js";
import { enrichTrafficWithZoneThreat } from "../threat/enrichTrafficWithZoneThreat.js";
import { getCachedZones } from "../threat/zoneGeometryCache.js";
import type { Asset } from "@dominion-dynamics/shared";
import { broadcastSnapshot } from "./ws.server.js";

/** Push a fully-built snapshot to the store, history ring, and WS clients. */
export function publishSnapshotAssets(assets: readonly Asset[]): Asset[] {
  const snapshot = [...assets];

  setAssets(snapshot);
  recordAssetTrackHistory(snapshot);
  broadcastSnapshot(snapshot);

  return snapshot;
}

type PublishLiveSnapshotParams = {
  traffic: readonly Asset[];
  drones?: readonly Asset[];
  enrich?: boolean;
};

/** Enrich traffic when requested, merge drones, and publish one live snapshot. */
export function publishLiveSnapshot({
  traffic,
  drones = [],
  enrich = false,
}: PublishLiveSnapshotParams): Asset[] {
  const enriched = enrich
    ? enrichTrafficWithZoneThreat(traffic, getCachedZones())
    : [...traffic];

  return publishSnapshotAssets(
    drones.length > 0 ? [...enriched, ...drones] : enriched,
  );
}

/** Re-enrich stored traffic and keep every drone in the snapshot. */
export function republishLiveSnapshot(): Asset[] {
  const stored = getAssetList();
  const drones = stored.filter(isDrone);
  const traffic = stored.filter((asset) => !isDrone(asset));

  return publishLiveSnapshot({
    traffic,
    drones,
    enrich: true,
  });
}
