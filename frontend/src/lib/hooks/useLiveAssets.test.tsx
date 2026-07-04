import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useLiveAssets } from "./useLiveAssets.js";

describe("useLiveAssets", () => {
  function installMockWebSocket() {
    let socket: MockWebSocket | undefined;
    let instances = 0;

    class MockWebSocket {
      onopen: (() => void) | null = null;
      onmessage: ((event: { data: string }) => void) | null = null;
      onclose: (() => void) | null = null;
      onerror: (() => void) | null = null;
      close = vi.fn();

      constructor(_url: string) {
        instances += 1;
        socket = this;
      }
    }

    vi.stubGlobal("WebSocket", MockWebSocket);

    return {
      get socket() {
        return socket;
      },
      get instances() {
        return instances;
      },
    };
  }

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("stores assets from a valid snapshot message", async () => {
    const mock = installMockWebSocket();
    const { result } = renderHook(() => useLiveAssets());

    mock.socket?.onopen?.();
    mock.socket?.onmessage?.({
      data: JSON.stringify({
        type: "snapshot",
        ts: 1_700_000_000_000,
        assets: [
          {
            id: "syn-1",
            lat: 45.4,
            lon: -75.7,
            alt: 1000,
            heading: 0,
            speed: 100,
            source: "synthetic",
          },
        ],
      }),
    });

    await waitFor(() => {
      expect(result.current.connected).toBe(true);
      expect(result.current.assets).toHaveLength(1);
      expect(result.current.lastUpdatedAt).toBe(1_700_000_000_000);
    });
  });

  it("ignores malformed JSON and invalid snapshot shapes", async () => {
    const mock = installMockWebSocket();
    const { result } = renderHook(() => useLiveAssets());

    mock.socket?.onopen?.();
    mock.socket?.onmessage?.({ data: "not-json" });
    mock.socket?.onmessage?.({
      data: JSON.stringify({ type: "event", ts: 1, assets: [] }),
    });

    await waitFor(() => {
      expect(result.current.connected).toBe(true);
    });

    expect(result.current.assets).toEqual([]);
    expect(result.current.lastUpdatedAt).toBeNull();
  });

  it("reconnects after the socket closes", async () => {
    vi.useFakeTimers();
    const mock = installMockWebSocket();
    const { result } = renderHook(() => useLiveAssets());

    await act(async () => {
      mock.socket?.onopen?.();
    });

    expect(result.current.connected).toBe(true);

    await act(async () => {
      mock.socket?.onclose?.();
    });

    expect(result.current.connected).toBe(false);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2_000);
    });

    expect(mock.instances).toBe(2);
  });
});
