import type { AssetHistoryPoint } from "@dominion-dynamics/shared";
import { trackHistoryCapacity } from "@dominion-dynamics/shared";
import type { Asset } from "@dominion-dynamics/shared";
import { simConfig } from "./config.js";

/** Ring buffer size derived from sim tick rate and the five-minute history window. */
export const TRACK_HISTORY_CAPACITY = trackHistoryCapacity(simConfig.tickMs);

type AssetTrackRing = {
  slots: AssetHistoryPoint[];
  start: number;
  size: number;
};

const buffers = new Map<string, AssetTrackRing>();

function emptyRing(): AssetTrackRing {
  return { slots: [], start: 0, size: 0 };
}

function appendPoint(ring: AssetTrackRing, point: AssetHistoryPoint): void {
  if (ring.size < TRACK_HISTORY_CAPACITY) {
    ring.slots.push(point);
    ring.size += 1;
    return;
  }

  ring.slots[ring.start] = point;
  ring.start = (ring.start + 1) % TRACK_HISTORY_CAPACITY;
}

function chronologicalPoints(ring: AssetTrackRing): AssetHistoryPoint[] {
  if (ring.size < TRACK_HISTORY_CAPACITY) {
    return [...ring.slots];
  }

  const points: AssetHistoryPoint[] = [];

  for (let index = 0; index < ring.size; index += 1) {
    points.push(
      ring.slots[(ring.start + index) % TRACK_HISTORY_CAPACITY] as AssetHistoryPoint,
    );
  }

  return points;
}

/** Drop all history (tests). */
export function clearAssetTrackHistory(): void {
  buffers.clear();
}

function sweepStaleBuffers(liveAssetIds: ReadonlySet<string>): void {
  for (const assetId of buffers.keys()) {
    if (!liveAssetIds.has(assetId)) {
      buffers.delete(assetId);
    }
  }
}

/** Append one point per asset after each live snapshot. */
export function recordAssetTrackHistory(
  assets: readonly Asset[],
  ts: number = Date.now(),
): void {
  const liveAssetIds = new Set<string>();

  for (const asset of assets) {
    liveAssetIds.add(asset.id);

    let ring = buffers.get(asset.id);

    if (!ring) {
      ring = emptyRing();
      buffers.set(asset.id, ring);
    }

    appendPoint(ring, { lat: asset.lat, lon: asset.lon, ts });
  }

  sweepStaleBuffers(liveAssetIds);
}

/** Chronological history for one asset (oldest first). */
export function getAssetTrackHistory(assetId: string): AssetHistoryPoint[] {
  const ring = buffers.get(assetId);

  if (!ring) {
    return [];
  }

  return chronologicalPoints(ring);
}
