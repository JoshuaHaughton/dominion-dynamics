import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { WebSocket } from "ws";
import { testAsset } from "@dominion-dynamics/shared/testing";
import {
  clearAssetTrackHistory,
  recordAssetTrackHistory,
} from "../sim/assetTrackHistory.js";
import { getAssetList, setAssets } from "../sim/store.js";
import {
  attachWebSocket,
  broadcastSnapshot,
  closeWebSocketServer,
  WS_LIVE_PATH,
} from "./ws.server.js";

type ReceivedMessage = {
  type: string;
  assets?: unknown[];
  selectedTrack?: { assetId: string };
  selectedTrackDelta?: { assetId: string; point: unknown };
};

/** Queue-backed client so each assertion can await the next server push. */
function createTestClient(port: number): {
  socket: WebSocket;
  nextMessage: () => Promise<ReceivedMessage>;
  open: () => Promise<void>;
} {
  const socket = new WebSocket(`ws://127.0.0.1:${port}${WS_LIVE_PATH}`);
  const queue: ReceivedMessage[] = [];
  const waiters: Array<(message: ReceivedMessage) => void> = [];

  socket.on("message", (data) => {
    const message = JSON.parse(String(data)) as ReceivedMessage;
    const waiter = waiters.shift();

    if (waiter) {
      waiter(message);
    } else {
      queue.push(message);
    }
  });

  return {
    socket,
    open: () =>
      new Promise((resolve, reject) => {
        socket.once("open", resolve);
        socket.once("error", reject);
      }),
    nextMessage: () =>
      new Promise((resolve, reject) => {
        const queued = queue.shift();

        if (queued) {
          resolve(queued);
          return;
        }

        waiters.push(resolve);
        setTimeout(
          () => reject(new Error("timed out waiting for ws message")),
          2000,
        );
      }),
  };
}

describe("ws.server select_asset flow", () => {
  const asset = testAsset({ id: "track-1" });
  let server: Server;
  let port = 0;

  beforeEach(async () => {
    setAssets([asset]);
    recordAssetTrackHistory([asset], 1000);

    server = createServer();
    attachWebSocket({ server, getConnectSnapshot: () => getAssetList() });

    await new Promise<void>((resolve) => {
      server.listen(0, resolve);
    });
    port = (server.address() as AddressInfo).port;
  });

  afterEach(async () => {
    closeWebSocketServer();
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
    setAssets([]);
    clearAssetTrackHistory();
  });

  it("sends a plain snapshot on connect, a full track on select, then deltas", async () => {
    const client = createTestClient(port);
    await client.open();

    const connectSnapshot = await client.nextMessage();
    expect(connectSnapshot.type).toBe("snapshot");
    expect(connectSnapshot.assets).toHaveLength(1);
    expect(connectSnapshot.selectedTrack).toBeUndefined();
    expect(connectSnapshot.selectedTrackDelta).toBeUndefined();

    client.socket.send(
      JSON.stringify({ type: "select_asset", assetId: "track-1" }),
    );

    const selectResponse = await client.nextMessage();
    expect(selectResponse.selectedTrack?.assetId).toBe("track-1");
    expect(selectResponse.selectedTrackDelta).toBeUndefined();

    recordAssetTrackHistory([{ ...asset, lat: asset.lat + 0.001 }], 2000);
    broadcastSnapshot(getAssetList());

    const broadcast = await client.nextMessage();
    expect(broadcast.selectedTrack).toBeUndefined();
    expect(broadcast.selectedTrackDelta?.assetId).toBe("track-1");
    expect(broadcast.selectedTrackDelta?.point).toEqual({
      lat: asset.lat + 0.001,
      lon: asset.lon,
      ts: 2000,
    });

    client.socket.close();
  });

  it("resets to plain snapshots after deselect_asset", async () => {
    const client = createTestClient(port);
    await client.open();
    await client.nextMessage();

    client.socket.send(
      JSON.stringify({ type: "select_asset", assetId: "track-1" }),
    );
    await client.nextMessage();

    client.socket.send(JSON.stringify({ type: "deselect_asset" }));

    // Deselect sends no immediate reply; the next broadcast must be plain.
    await new Promise((resolve) => setTimeout(resolve, 50));
    broadcastSnapshot(getAssetList());

    const broadcast = await client.nextMessage();
    expect(broadcast.selectedTrack).toBeUndefined();
    expect(broadcast.selectedTrackDelta).toBeUndefined();

    client.socket.close();
  });
});
