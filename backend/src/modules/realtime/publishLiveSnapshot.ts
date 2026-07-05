import { getAssetList, isPatrolAsset, setAssets } from "../sim/store.js";
import { recordAssetTrackHistory } from "../sim/assetTrackHistory.js";
import { enrichTrafficWithZoneThreat } from "../threat/enrichTrafficWithZoneThreat.js";
import { getCachedZones } from "../threat/zoneGeometryCache.js";
import type { Asset } from "@dominion-dynamics/shared";
import { broadcastSnapshot } from "./ws.server.js";

export { enrichTrafficWithZoneThreat } from "../threat/enrichTrafficWithZoneThreat.js";

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

/** Recompute zone fields for traffic and publish (no patrol drone). */
export function publishTrafficSnapshot(trafficPositions: readonly Asset[]): Asset[] {
  return publishSnapshotAssets(
    enrichTrafficWithZoneThreat(trafficPositions, getCachedZones()),
  );
}

/** Re-enrich stored traffic and keep the current patrol asset. */
export function republishLiveSnapshot(): Asset[] {
  const stored = getAssetList();
  const patrol = stored.find(isPatrolAsset) ?? null;
  const enriched = enrichTrafficWithZoneThreat(
    trafficOnly(stored),
    getCachedZones(),
  );

  return publishSnapshotAssets(patrol ? [...enriched, patrol] : enriched);
}

/** Enrich traffic, append patrol, and publish one snapshot. */
export function publishTrafficWithPatrol(
  trafficPositions: readonly Asset[],
  patrolAsset: Asset,
): Asset[] {
  return publishSnapshotAssets([
    ...enrichTrafficWithZoneThreat(trafficPositions, getCachedZones()),
    patrolAsset,
  ]);
}

/** Append an optional patrol asset to an already-enriched traffic snapshot. */
export function publishEnrichedTrafficWithPatrol(
  enrichedTraffic: readonly Asset[],
  patrolAsset: Asset | null,
): Asset[] {
  return publishSnapshotAssets(
    patrolAsset ? [...enrichedTraffic, patrolAsset] : [...enrichedTraffic],
  );
}
