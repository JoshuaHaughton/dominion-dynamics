import { useEffect, useRef, useState } from "react";
import { getLiveWebSocketUrl } from "../config/env.js";
import {
  AssetSchema,
  DEFAULT_TRACK_HISTORY_CAPACITY,
  LiveServerMessageSchema,
  type Asset,
  type AssetHistoryPoint,
  type AssetTrackDetail,
} from "@dominion-dynamics/shared";
import { z } from "zod";

const RECONNECT_MS = 2_000;

const SnapshotAssetsSchema = z.object({
  type: z.literal("snapshot"),
  ts: z.number().finite(),
  assets: z.array(AssetSchema),
});

type LiveAssetsState = {
  assets: Asset[];
  connected: boolean;
  lastUpdatedAt: number | null;
  trackDetail: AssetTrackDetail | null;
};

function sendSelection(ws: WebSocket, assetId: string | null): void {
  if (assetId === null) {
    ws.send(JSON.stringify({ type: "deselect_asset" }));
    return;
  }

  ws.send(JSON.stringify({ type: "select_asset", assetId }));
}

function appendHistoryPoint(
  history: readonly AssetHistoryPoint[],
  point: AssetHistoryPoint,
  maxPoints: number,
): AssetHistoryPoint[] {
  const next = [...history, point];

  if (next.length <= maxPoints) {
    return next;
  }

  return next.slice(next.length - maxPoints);
}

/** Close without racing a socket that is still connecting (Strict Mode safe). */
function closeLiveSocket(socket: WebSocket | undefined): void {
  if (!socket) {
    return;
  }

  if (socket.readyState === WebSocket.CONNECTING) {
    socket.addEventListener(
      "open",
      () => {
        socket.close();
      },
      { once: true },
    );
    return;
  }

  if (
    socket.readyState === WebSocket.OPEN ||
    socket.readyState === WebSocket.CLOSING
  ) {
    socket.close();
  }
}

/** Subscribe to the backend live WebSocket stream and track overlay pushes. */
export function useLiveAssets(selectedAssetId: string | null): LiveAssetsState {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [connected, setConnected] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);
  const [trackDetail, setTrackDetail] = useState<AssetTrackDetail | null>(null);
  const wsRef = useRef<WebSocket | undefined>(undefined);
  const selectedAssetIdRef = useRef(selectedAssetId);
  const historyCapRef = useRef(DEFAULT_TRACK_HISTORY_CAPACITY);
  selectedAssetIdRef.current = selectedAssetId;

  useEffect(() => {
    if (selectedAssetId === null) {
      setTrackDetail(null);
    }
  }, [selectedAssetId]);

  useEffect(() => {
    const ws = wsRef.current;

    if (!ws || ws.readyState !== WebSocket.OPEN) {
      return;
    }

    sendSelection(ws, selectedAssetId);
  }, [selectedAssetId]);

  useEffect(() => {
    let ws: WebSocket | undefined;
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
    let cancelled = false;

    function connect(): void {
      ws = new WebSocket(getLiveWebSocketUrl());
      wsRef.current = ws;

      ws.onopen = () => {
        if (cancelled) {
          closeLiveSocket(ws);
          return;
        }

        setConnected(true);
        sendSelection(ws!, selectedAssetIdRef.current);
      };

      ws.onmessage = (event) => {
        if (cancelled) return;

        try {
          const body = JSON.parse(String(event.data));
          const base = SnapshotAssetsSchema.safeParse(body);

          if (!base.success) {
            return;
          }

          setAssets(base.data.assets);
          setLastUpdatedAt(base.data.ts);

          const selectedId = selectedAssetIdRef.current;

          if (selectedId === null) {
            setTrackDetail(null);
            return;
          }

          const parsed = LiveServerMessageSchema.safeParse(body);

          if (!parsed.success) {
            return;
          }

          const message = parsed.data;

          if (message.selectedTrack?.assetId === selectedId) {
            historyCapRef.current = Math.max(
              historyCapRef.current,
              message.selectedTrack.history.length,
            );
            setTrackDetail(message.selectedTrack);
            return;
          }

          if (message.selectedTrackDelta?.assetId === selectedId) {
            const delta = message.selectedTrackDelta;

            setTrackDetail((current) => {
              if (current?.assetId !== selectedId) {
                return current;
              }

              return {
                assetId: selectedId,
                history: appendHistoryPoint(
                  current.history,
                  delta.point,
                  historyCapRef.current,
                ),
                predictedPath: delta.predictedPath,
              };
            });
          }
        } catch {
          return;
        }
      };

      ws.onclose = () => {
        if (cancelled) return;

        setConnected(false);
        reconnectTimer = setTimeout(connect, RECONNECT_MS);
      };

      ws.onerror = () => {
        closeLiveSocket(ws);
      };
    }

    connect();

    return () => {
      cancelled = true;
      clearTimeout(reconnectTimer);
      closeLiveSocket(ws);
      wsRef.current = undefined;
    };
  }, []);

  return { assets, connected, lastUpdatedAt, trackDetail };
}
