import { simConfig } from "./config.js";
import { seedAssets } from "./seed.js";
import { setAssets, getAssetList } from "./store.js";
import { startTicker, stopTicker } from "./ticker.js";
import { enrichAssetsWithThreat } from "../threat/evaluateAsset.js";
import { getCachedZones } from "../threat/zoneGeometryCache.js";
import type { Asset } from "@dominion-dynamics/shared";

export type StartSimOptions = {
  onTick?: (assets: Asset[]) => void;
};

let running = false;

/** Seeds assets and starts the ticker. No-op if already running. */
export function startSim(options: StartSimOptions = {}): void {
  if (running) {
    return;
  }

  running = true;

  const seeded = seedAssets(simConfig.assetCount);
  const zones = getCachedZones();

  setAssets(enrichAssetsWithThreat(seeded, zones));

  startTicker((assets) => {
    options.onTick?.(assets);
  });
}

/** Stop the ticker and mark sim as idle. */
export function stopSim(): void {
  stopTicker();
  running = false;
}

/** Read-only snapshot of current assets (positions and threat fields). */
export function getAssets(): readonly Asset[] {
  return getAssetList();
}
