import http from "node:http";
import cors from "cors";
import express from "express";
import "./db/index.js";
import { healthRouter } from "./api/routes/health.js";
import { zonesRouter } from "./api/routes/zones.js";
import {
  attachWebSocket,
  broadcastSnapshot,
  closeWebSocketServer,
  WS_LIVE_PATH,
} from "./realtime/ws.server.js";
import { loadZoneGeometryCache } from "./threat/zoneGeometryCache.js";
import { getAssets, startSim, stopSim } from "./sim/service.js";

const app = express();
const port = Number(process.env.PORT ?? 8000);

app.use(
  cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
  }),
);
app.use(express.json());

app.use("/api/health", healthRouter);
app.use("/api/zones", zonesRouter);

loadZoneGeometryCache();

const server = http.createServer(app);

attachWebSocket({ server, getConnectSnapshot: getAssets });

startSim({ onTick: broadcastSnapshot });

server.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
  console.log(`WebSocket live at ws://localhost:${port}${WS_LIVE_PATH}`);
});

function shutdown(): void {
  console.log("\nShutting down...");

  stopSim();
  closeWebSocketServer();
  server.close(() => {
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
