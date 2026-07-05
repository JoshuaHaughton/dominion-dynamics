import { getAssetList, isPatrolAsset, setAssets } from "../sim/store.js";
import { recordAssetTrackHistory } from "../sim/assetTrackHistory.js";
import { enrichTrafficWithZoneThreat } from "../threat/enrichTrafficWithZoneThreat.js";
import { getCachedZones } from "../threat/zoneGeometryCache.js";
import type { Asset } from "@dominion-dynamics/shared";
import { broadcastSnapshot } from "./ws.server.js";

function trafficOnly(assets: readonly Asset[]): Asset[] {
  return assets.filter((asset) => !isPatrolAsset(asset));
}

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
  patrol?: Asset | null;
  enrich?: boolean;
};

/** Enrich traffic when requested, merge patrol, and publish one live snapshot. */
export function publishLiveSnapshot({
  traffic,
  patrol = null,
  enrich = false,
}: PublishLiveSnapshotParams): Asset[] {
  const enriched = enrich
    ? enrichTrafficWithZoneThreat(traffic, getCachedZones())
    : [...traffic];

  return publishSnapshotAssets(patrol ? [...enriched, patrol] : enriched);
}

/** Re-enrich stored traffic and keep the current patrol asset. */
export function republishLiveSnapshot(): Asset[] {
  const stored = getAssetList();
  const patrol = stored.find(isPatrolAsset) ?? null;

  return publishLiveSnapshot({
    traffic: trafficOnly(stored),
    patrol,
    enrich: true,
  });
}
