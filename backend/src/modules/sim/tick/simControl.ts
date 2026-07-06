import { simConfig } from "../config.js";
import { seedAssets } from "../seed/seed.js";
import { publishLiveSnapshot } from "../../realtime/publishLiveSnapshot.js";
import { enrichTrafficWithZoneThreat } from "../../threat/zone/enrichTrafficWithZoneThreat.js";
import { getCachedZones } from "../../threat/zone/zoneGeometryCache.js";
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

  const initialTraffic = seedAssets(simConfig.assetCount);
  publishLiveSnapshot({
    traffic: enrichTrafficWithZoneThreat(initialTraffic, getCachedZones()),
  });

  startTicker((assets) => {
    options.onTick?.(assets);
  });
}

/** Stop the ticker and mark sim as idle. */
export function stopSim(): void {
  stopTicker();
  running = false;
}
