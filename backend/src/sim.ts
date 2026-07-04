import { simConfig } from "./sim/config.js";
import { startSim, stopSim } from "./sim/service.js";

const { seedRegion } = simConfig;

console.log(
  `Sim starting: ${simConfig.assetCount} assets, ${simConfig.tickMs}ms tick, mode=${simConfig.ingestMode}`,
);
console.log(
  `Seed region (Ottawa AOI): lat ${seedRegion.minLat}-${seedRegion.maxLat}, lon ${seedRegion.minLon}-${seedRegion.maxLon}`,
);

let tickCount = 0;

startSim({
  onTick: (assets) => {
    tickCount += 1;
    const sample = assets[0];
    console.log(
      `[tick ${tickCount}] ${assets.length} assets | ${sample.id} lat=${sample.lat.toFixed(4)} lon=${sample.lon.toFixed(4)}`,
    );
  },
});

function shutdown(): void {
  console.log("\nStopping sim...");
  stopSim();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
