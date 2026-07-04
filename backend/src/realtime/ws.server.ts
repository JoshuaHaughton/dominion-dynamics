import type { Server } from "node:http";
import type { Asset } from "@dominion-dynamics/shared";
import { WebSocket, WebSocketServer } from "ws";
import { buildSnapshotMessage } from "./messages.js";

export const WS_LIVE_PATH = "/ws/live";

let wss: WebSocketServer | undefined;

type AttachWebSocketParams = {
  server: Server;
  /** Positions and threat fields sent when a client connects. */
  getConnectSnapshot: () => readonly Asset[];
};

/** JSON-encode a snapshot message for the wire. */
function serializeSnapshot(assets: readonly Asset[]): string {
  return JSON.stringify(buildSnapshotMessage([...assets]));
}

/** Send one snapshot to a single open client. */
function sendSnapshot(ws: WebSocket, assets: readonly Asset[]): void {
  if (ws.readyState !== WebSocket.OPEN) {
    return;
  }

  ws.send(serializeSnapshot(assets));
}

/** Attach a WebSocket server to the shared HTTP server. */
export function attachWebSocket({
  server,
  getConnectSnapshot,
}: AttachWebSocketParams): void {
  wss = new WebSocketServer({ server, path: WS_LIVE_PATH });

  wss.on("connection", (ws) => {
    sendSnapshot(ws, getConnectSnapshot());
  });
}

/** Push a snapshot to every open client. */
export function broadcastSnapshot(assets: readonly Asset[]): void {
  if (!wss) {
    return;
  }

  const payload = serializeSnapshot(assets);

  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
}

export function closeWebSocketServer(): void {
  wss?.close();
  wss = undefined;
}
