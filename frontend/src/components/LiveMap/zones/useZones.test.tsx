import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Zone } from "@dominion-dynamics/shared";
import { ottawaZonePolygon } from "@dominion-dynamics/shared/testing";
import {
  createZone,
  deleteZone,
  fetchZones,
} from "../../../lib/api/clients/zonesApi.js";
import { useZones } from "./useZones.js";

vi.mock("../../../lib/api/clients/zonesApi.js", () => ({
  fetchZones: vi.fn(),
  createZone: vi.fn(),
  deleteZone: vi.fn(),
}));

describe("useZones", () => {
  const savedZone: Zone = {
    id: 1,
    name: "Zone 1",
    geojson: ottawaZonePolygon(),
  };

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("loads persisted zones on mount and flips isLoaded", async () => {
    vi.mocked(fetchZones).mockResolvedValue([savedZone]);

    const { result } = renderHook(() => useZones());

    expect(result.current.isLoaded).toBe(false);

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });
    expect(result.current.zones).toEqual([savedZone]);
    expect(result.current.error).toBeNull();
  });

  it("surfaces the load error but still reports loaded", async () => {
    vi.mocked(fetchZones).mockRejectedValue(new Error("Failed to load zones"));

    const { result } = renderHook(() => useZones());

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });
    expect(result.current.error).toBe("Failed to load zones");
  });

  it("adds a drawn zone optimistically, then swaps in the saved row", async () => {
    vi.mocked(fetchZones).mockResolvedValue([]);

    let resolveCreate: (zone: Zone) => void = () => {};
    vi.mocked(createZone).mockReturnValue(
      new Promise((resolve) => {
        resolveCreate = resolve;
      }),
    );

    const { result } = renderHook(() => useZones());
    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    act(() => {
      result.current.addZoneFromDraw(ottawaZonePolygon());
    });

    expect(result.current.zones).toHaveLength(1);
    expect(result.current.zones[0]).toMatchObject({
      name: "Zone 1",
      pending: true,
    });

    await act(async () => {
      resolveCreate(savedZone);
    });

    await waitFor(() => {
      expect(result.current.zones).toEqual([savedZone]);
    });
  });

  it("rolls the optimistic zone back when the save fails", async () => {
    vi.mocked(fetchZones).mockResolvedValue([]);
    vi.mocked(createZone).mockRejectedValue(new Error("Failed to save zone"));

    const { result } = renderHook(() => useZones());
    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    act(() => {
      result.current.addZoneFromDraw(ottawaZonePolygon());
    });

    await waitFor(() => {
      expect(result.current.zones).toEqual([]);
    });
    expect(result.current.error).toBe("Failed to save zone");
  });

  it("rejects an invalid drawing without calling the API", async () => {
    vi.mocked(fetchZones).mockResolvedValue([]);

    const { result } = renderHook(() => useZones());
    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    const openRing = ottawaZonePolygon();
    openRing.geometry.coordinates = [
      [
        [-75.8, 45.3],
        [-75.6, 45.3],
      ],
    ];

    act(() => {
      result.current.addZoneFromDraw(openRing);
    });

    expect(result.current.zones).toEqual([]);
    expect(result.current.error).not.toBeNull();
    expect(createZone).not.toHaveBeenCalled();
  });

  it("removes a zone after a successful delete", async () => {
    vi.mocked(fetchZones).mockResolvedValue([savedZone]);
    vi.mocked(deleteZone).mockResolvedValue(undefined);

    const { result } = renderHook(() => useZones());
    await waitFor(() => {
      expect(result.current.zones).toHaveLength(1);
    });

    act(() => {
      result.current.removeZone(savedZone.id);
    });

    expect(result.current.zones).toEqual([]);
  });

  it("keeps the zone and sets an error when the delete fails", async () => {
    vi.mocked(fetchZones).mockResolvedValue([savedZone]);
    vi.mocked(deleteZone).mockRejectedValue(new Error("Failed to delete zone"));

    const { result } = renderHook(() => useZones());
    await waitFor(() => {
      expect(result.current.zones).toHaveLength(1);
    });

    act(() => {
      result.current.removeZone(savedZone.id);
    });

    await waitFor(() => {
      expect(result.current.zones).toEqual([savedZone]);
      expect(result.current.error).toBe("Failed to delete zone");
    });
  });
});
