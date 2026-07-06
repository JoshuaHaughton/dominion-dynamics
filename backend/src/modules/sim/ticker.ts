import { simConfig } from "./config.js";
import { stepAsset } from "./movement.js";
import { isInsideSeedRegion, respawnAtBoundary } from "./seed.js";
import { getTrafficAssets } from "./store.js";
import { publishLiveSnapshot } from "../realtime/publishLiveSnapshot.js";
import { enrichTrafficWithZoneThreat } from "../threat/enrichTrafficWithZoneThreat.js";
import { getCachedZones } from "../threat/zoneGeometryCache.js";
import { tickAllDrones } from "../patrol/patrolTick.js";
import { syncDispatchAllocator } from "../dispatch/syncDispatchAllocator.js";
import type { Asset, SimBounds } from "@dominion-dynamics/shared";

let intervalId: ReturnType<typeof setInterval> | null = null;

type AdvanceAssetsParams = {
  assets: Asset[];
  deltaSeconds: number;
  seedRegion: SimBounds;
};

export type RunSimTickParams = {
  deltaSeconds: number;
  seedRegion: SimBounds;
  nowMs?: number;
};

/** Move each asset one tick; respawn at boundary when a track exits the operating area. */
export function advanceAssets({
  assets,
  deltaSeconds,
  seedRegion,
}: AdvanceAssetsParams): Asset[] {
  return assets.map((asset) => {
    const moved = stepAsset({ asset, deltaSeconds });

    if (isInsideSeedRegion(moved, seedRegion)) {
      return moved;
    }

    return respawnAtBoundary(asset, seedRegion);
  });
}

/** One full sim tick: traffic, threat enrich, auto-dispatch, drones, snapshot. */
export function runSimTick({
  deltaSeconds,
  seedRegion,
  nowMs = Date.now(),
}: RunSimTickParams): Asset[] {
  const moved = advanceAssets({
    assets: getTrafficAssets(),
    deltaSeconds,
    seedRegion,
  });
  const enrichedTraffic = enrichTrafficWithZoneThreat(moved, getCachedZones());

  syncDispatchAllocator(enrichedTraffic, nowMs);

  const drones = tickAllDrones({
    liveAssets: enrichedTraffic,
    deltaSeconds,
  });

  return publishLiveSnapshot({
    traffic: enrichedTraffic,
    drones,
  });
}

/** Starts the 1Hz interval. No-op if already running. */
export function startTicker(onTick: (assets: Asset[]) => void): void {
  if (intervalId) {
    return;
  }

  const deltaSeconds = simConfig.tickMs / 1000;
  const { seedRegion } = simConfig;

  intervalId = setInterval(() => {
    const assets = runSimTick({ deltaSeconds, seedRegion });
    onTick(assets);
  }, simConfig.tickMs);
}

/** Stop the tick loop if running. */
export function stopTicker(): void {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}
