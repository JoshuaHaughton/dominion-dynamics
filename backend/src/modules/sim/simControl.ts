import { simConfig } from "./config.js";
import { seedAssets } from "./seed.js";
import { getAssetList } from "./store.js";
import { publishTrafficSnapshot } from "../realtime/publishLiveSnapshot.js";
import { startTicker, stopTicker } from "./ticker.js";
import type { Asset } from "@dominion-dynamics/shared";

export type StartSimOptions = {
  onTick?: (assets: Asset[]) => void;
};

let running = false;

/** Seeds assets and starts the ticker. No-op if already running. */
export function startSim(options: StartSimOptions = {}): void {
  if (running) return;

  running = true;

  publishTrafficSnapshot(seedAssets(simConfig.assetCount));

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
