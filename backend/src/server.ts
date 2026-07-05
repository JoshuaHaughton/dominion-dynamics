import http from "node:http";
import cors from "cors";
import express from "express";
import "./db/index.js";
import { assetsRouter } from "./api/routes/assets.js";
import { healthRouter } from "./api/routes/health.js";
import { zonesRouter } from "./api/routes/zones.js";
import { patrolPathRouter } from "./api/routes/patrolPath.js";
import {
  attachWebSocket,
  closeWebSocketServer,
  WS_LIVE_PATH,
} from "./modules/realtime/ws.server.js";
import { loadZoneGeometryCache } from "./modules/threat/zoneGeometryCache.js";
import { getAssets, startSim, stopSim } from "./modules/sim/simControl.js";

const port = Number(process.env.PORT ?? 8000);

let shuttingDown = false;

const app = express();

app.use(
  cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
  }),
);
app.use(express.json());

app.use("/api/health", healthRouter);
app.use("/api/assets", assetsRouter);
app.use("/api/zones", zonesRouter);
app.use("/api/patrol-path", patrolPathRouter);

loadZoneGeometryCache();

const server = http.createServer(app);

attachWebSocket({ server, getConnectSnapshot: getAssets });

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

  // tsx watch force-kills after 5s if clients keep the HTTP socket open.
  setTimeout(() => {
    process.exit(0);
  }, 4_000).unref();
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
