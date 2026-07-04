import { useEffect, useState } from "react";
import { getLiveWebSocketUrl } from "../config/env.js";
import { parseSnapshotMessage } from "../wire/parseSnapshotMessage.js";
import type { Asset } from "@dominion-dynamics/shared";

const RECONNECT_MS = 2_000;

type LiveAssetsState = {
  assets: Asset[];
  connected: boolean;
  lastUpdatedAt: number | null;
};

/** Subscribe to the backend live snapshot WebSocket stream. */
export function useLiveAssets(): LiveAssetsState {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [connected, setConnected] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);

  useEffect(() => {
    let ws: WebSocket | undefined;
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
    // Ignore socket events after unmount
    let cancelled = false;

    function connect(): void {
      ws = new WebSocket(getLiveWebSocketUrl());

      ws.onopen = () => {
        if (cancelled) return;

        setConnected(true);
      };

      ws.onmessage = (event) => {
        if (cancelled) return;

        try {
          const message = parseSnapshotMessage(JSON.parse(String(event.data)));

          if (!message) return;

          setAssets(message.assets);
          setLastUpdatedAt(message.ts);
        } catch {
          // Ignore malformed frames until the next snapshot tick.
        }
      };

      ws.onclose = () => {
        if (cancelled) return;

        setConnected(false);
        reconnectTimer = setTimeout(connect, RECONNECT_MS);
      };

      ws.onerror = () => {
        ws?.close();
      };
    }

    connect();

    return () => {
      cancelled = true;
      clearTimeout(reconnectTimer);
      ws?.close();
    };
  }, []);

  return { assets, connected, lastUpdatedAt };
}
