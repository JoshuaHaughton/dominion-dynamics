import http from "node:http";
import "./db/index.js";
import { createApp } from "./app.js";
import {
  attachWebSocket,
  closeWebSocketServer,
  WS_LIVE_PATH,
} from "./modules/realtime/ws.server.js";
import { startSim, stopSim } from "./modules/sim/tick/simControl.js";
import { getAssetSnapshot } from "./modules/sim/store/store.js";
import {
  ensureDefaultPatrolPath,
  resolvePatrolPath,
} from "./services/patrol/patrolPathService.js";
import { hydrateZoneGeometryCache } from "./services/zones/zoneService.js";
import { initializePatrolDrone } from "./modules/patrol/tick/patrolTick.js";

const port = Number(process.env.PORT) || 8000;

let shuttingDown = false;

const app = createApp();

hydrateZoneGeometryCache();
ensureDefaultPatrolPath();
initializePatrolDrone(resolvePatrolPath());

const server = http.createServer(app);

attachWebSocket({ server, getConnectSnapshot: getAssetSnapshot });

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
