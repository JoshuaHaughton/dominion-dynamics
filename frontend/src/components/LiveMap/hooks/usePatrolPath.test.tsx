import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { PathGeoJson } from "@dominion-dynamics/shared";
import { ottawaPatrolPathOpen } from "@dominion-dynamics/shared/testing";
import {
  fetchPatrolPath,
  savePatrolPath,
} from "../../../lib/api/clients/patrolPathApi.js";
import { usePatrolPath } from "./usePatrolPath.js";

vi.mock("../../../lib/api/clients/patrolPathApi.js", () => ({
  fetchPatrolPath: vi.fn(),
  savePatrolPath: vi.fn(),
}));

describe("usePatrolPath", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("loads the saved route on mount", async () => {
    const saved = ottawaPatrolPathOpen();
    vi.mocked(fetchPatrolPath).mockResolvedValue(saved);

    const { result } = renderHook(() => usePatrolPath());

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });
    expect(result.current.patrolPath).toEqual(saved);
  });

  it("applies a drawn route optimistically and persists it", async () => {
    vi.mocked(fetchPatrolPath).mockResolvedValue(null);
    vi.mocked(savePatrolPath).mockResolvedValue(undefined);

    const { result } = renderHook(() => usePatrolPath());
    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    const drawn = ottawaPatrolPathOpen();

    act(() => {
      result.current.addPatrolPathFromDraw(drawn);
    });

    expect(result.current.patrolPath).toEqual(drawn);

    await waitFor(() => {
      expect(result.current.isSaving).toBe(false);
    });
    expect(savePatrolPath).toHaveBeenCalledWith({ geojson: drawn });
    expect(result.current.error).toBeNull();
  });

  it("reverts to the previous route when the save fails", async () => {
    const previous = ottawaPatrolPathOpen();
    vi.mocked(fetchPatrolPath).mockResolvedValue(previous);
    vi.mocked(savePatrolPath).mockRejectedValue(
      new Error("Failed to save patrol path"),
    );

    const { result } = renderHook(() => usePatrolPath());
    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    const drawn: PathGeoJson = {
      type: "Feature",
      properties: {},
      geometry: {
        type: "LineString",
        coordinates: [
          [-76.0, 45.1],
          [-75.9, 45.2],
        ],
      },
    };

    act(() => {
      result.current.addPatrolPathFromDraw(drawn);
    });

    await waitFor(() => {
      expect(result.current.patrolPath).toEqual(previous);
    });
    expect(result.current.error).toBe("Failed to save patrol path");
  });

  it("surfaces a validation message for an invalid drawing without saving", async () => {
    vi.mocked(fetchPatrolPath).mockResolvedValue(null);

    const { result } = renderHook(() => usePatrolPath());
    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    const singlePoint = {
      type: "Feature",
      properties: {},
      geometry: {
        type: "LineString",
        coordinates: [[-75.8, 45.3]],
      },
    } as PathGeoJson;

    act(() => {
      result.current.addPatrolPathFromDraw(singlePoint);
    });

    expect(result.current.patrolPath).toBeNull();
    expect(result.current.error).not.toBeNull();
    expect(savePatrolPath).not.toHaveBeenCalled();
  });
});
