import http from "node:http";
import { z } from "zod";
import "./db/index.js";
import { db } from "./db/index.js";
import { createApp } from "./app.js";
import {
  attachWebSocket,
  closeWebSocketServer,
  WS_LIVE_PATH,
} from "./modules/realtime/ws.server.js";
import { primeZoneGeometryCache } from "./modules/threat/zoneGeometryCache.js";
import { startSim, stopSim } from "./modules/sim/simControl.js";
import { getAssetList } from "./modules/sim/store.js";
import { listZoneRows } from "./repositories/zoneRepository.js";
import {
  ensureDefaultPatrolPath,
  resolvePatrolPath,
} from "./services/patrol/patrolPathService.js";
import { initializePatrolDrone } from "./modules/patrol/patrolTick.js";

const port = z.coerce
  .number()
  .int()
  .positive()
  .default(8000)
  .parse(process.env.PORT);

let shuttingDown = false;

/** Hydrate the passive zone geometry cache from SQLite before the sim starts. */
function hydrateZoneGeometryCache(): void {
  try {
    primeZoneGeometryCache(listZoneRows(db));
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);

    console.warn(
      `Failed to load zone geometry cache (${detail}); using no zones.`,
    );
    primeZoneGeometryCache([]);
  }
}

const app = createApp();

hydrateZoneGeometryCache();
ensureDefaultPatrolPath();
initializePatrolDrone(resolvePatrolPath());

const server = http.createServer(app);

attachWebSocket({ server, getConnectSnapshot: getAssetList });

startSim();

server.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
  console.log(`WebSocket live at ws://localhost:${port}${WS_LIVE_PATH}`);
});

function shutdown(): void {
  if (shuttingDown) return;

  shuttingDown = true;
  console.log("\nShutting down...");

  stopSim();
  closeWebSocketServer();
  server.closeAllConnections();
  server.close(() => {
    process.exit(0);
  });

  setTimeout(() => {
    process.exit(0);
  }, 4_000).unref(); // tsx watch force-kills if HTTP/WS sockets linger
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
