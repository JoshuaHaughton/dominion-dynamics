import type { Server } from "node:http";
import type { Asset } from "@dominion-dynamics/shared";
import { ClientLiveMessageSchema } from "@dominion-dynamics/shared";
import { WebSocket, WebSocketServer } from "ws";
import {
  buildSelectedTrackDelta,
  getAssetTrackDetail,
} from "../track/buildAssetTrack.js";
import { getAssetList } from "../sim/store.js";
import { getConnectionState, type ConnectionState } from "./connectionState.js";
import { buildSnapshotMessage } from "./messages.js";

export const WS_LIVE_PATH = "/ws/live";

let wss: WebSocketServer | undefined;

type AttachWebSocketParams = {
  server: Server;
  /** Positions and threat fields sent when a client connects. */
  getConnectSnapshot: () => readonly Asset[];
};

function serializeSnapshot(
  assets: readonly Asset[],
  state: ConnectionState,
  ts: number = Date.now(),
): string {
  const { selectedAssetId, trackSynced } = state;

  if (selectedAssetId === null) {
    return JSON.stringify(
      buildSnapshotMessage({ assets: [...assets], ts }),
    );
  }

  if (!trackSynced) {
    const selectedTrack = getAssetTrackDetail(selectedAssetId) ?? undefined;

    return JSON.stringify(
      buildSnapshotMessage({
        assets: [...assets],
        ts,
        selectedTrack,
      }),
    );
  }

  const selectedTrackDelta =
    buildSelectedTrackDelta(selectedAssetId) ?? undefined;

  return JSON.stringify(
    buildSnapshotMessage({
      assets: [...assets],
      ts,
      selectedTrackDelta,
    }),
  );
}

/** Send one snapshot to a single open client. */
function sendSnapshot(
  ws: WebSocket,
  assets: readonly Asset[],
  state: ConnectionState,
): void {
  if (ws.readyState !== WebSocket.OPEN) {
    return;
  }

  const hadSelection = state.selectedAssetId !== null;
  const needsFullTrack = hadSelection && !state.trackSynced;

  ws.send(serializeSnapshot(assets, state));

  if (needsFullTrack) {
    state.trackSynced = true;
  }
}

function handleClientMessage(ws: WebSocket, raw: string): void {
  let body: unknown;

  try {
    body = JSON.parse(raw);
  } catch {
    return;
  }

  const parsed = ClientLiveMessageSchema.safeParse(body);

  if (!parsed.success) {
    return;
  }

  const state = getConnectionState(ws);

  if (parsed.data.type === "select_asset") {
    state.selectedAssetId = parsed.data.assetId;
    state.trackSynced = false;
    sendSnapshot(ws, getAssetList(), state);
    return;
  }

  state.selectedAssetId = null;
  state.trackSynced = false;
}

/** Attach a WebSocket server to the shared HTTP server. */
export function attachWebSocket({
  server,
  getConnectSnapshot,
}: AttachWebSocketParams): void {
  wss = new WebSocketServer({ server, path: WS_LIVE_PATH });

  wss.on("connection", (ws) => {
    const state = getConnectionState(ws);
    state.selectedAssetId = null;
    state.trackSynced = false;

    ws.on("message", (data) => {
      handleClientMessage(ws, String(data));
    });

    sendSnapshot(ws, getConnectSnapshot(), state);
  });
}

/** Push a snapshot to every open client, with track data when applicable. */
export function broadcastSnapshot(assets: readonly Asset[]): void {
  if (!wss) {
    return;
  }

  const ts = Date.now();

  for (const client of wss.clients) {
    if (client.readyState !== WebSocket.OPEN) {
      continue;
    }

    const state = getConnectionState(client);
    client.send(serializeSnapshot(assets, state, ts));
  }
}

/** Close every client with a normal shutdown code, then stop the WebSocket server. */
export function closeWebSocketServer(): void {
  if (!wss) {
    return;
  }

  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.close(1001, "Server shutting down");
    } else {
      client.terminate();
    }
  }

  wss.close();
  wss = undefined;
}
