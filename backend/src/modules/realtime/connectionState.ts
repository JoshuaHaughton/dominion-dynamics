import type { WebSocket } from "ws";

export type ConnectionState = {
  selectedAssetId: string | null;
  /** True after the client has received a full selectedTrack for the current selection. */
  trackSynced: boolean;
};

const connectionStateBySocket = new WeakMap<WebSocket, ConnectionState>();

function createConnectionState(): ConnectionState {
  return { selectedAssetId: null, trackSynced: false };
}

/** Per-connection state keyed by the live WebSocket instance. */
export function getConnectionState(ws: WebSocket): ConnectionState {
  let state = connectionStateBySocket.get(ws);

  if (!state) {
    state = createConnectionState();
    connectionStateBySocket.set(ws, state);
  }

  return state;
}
