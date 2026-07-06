import { afterEach, describe, expect, it } from "vitest";
import { PATROL_ASSET_ID } from "@dominion-dynamics/shared";
import { ottawaPatrolPathOpen } from "@dominion-dynamics/shared/testing";
import { clearPatrolDroneStates, getPatrolDroneState } from "./droneStore.js";
import { initializePatrolDrone, tickPatrolDrone } from "./patrolTick.js";
import type { ResolvedPatrolPath } from "./types.js";

describe("patrolTick", () => {
  const patrolPath: ResolvedPatrolPath = {
    id: 1,
    geojson: ottawaPatrolPathOpen(),
  };

  afterEach(() => {
    clearPatrolDroneStates();
  });

  it("does nothing when no patrol path exists", () => {
    initializePatrolDrone(null);

    expect(getPatrolDroneState(PATROL_ASSET_ID)).toBeUndefined();
    expect(
      tickPatrolDrone({ liveAssets: [], deltaSeconds: 1, patrolPath: null }),
    ).toBeNull();
  });

  it("initializes the patrol drone at the saved route start", () => {
    initializePatrolDrone(patrolPath);

    const state = getPatrolDroneState(PATROL_ASSET_ID);

    expect(state?.asset.role).toBe("drone");
    expect(state?.mode).toBe("patrol");
    expect(state?.asset.zone).toBeNull();
  });

  it("returns a patrol wire asset that moves on tick", () => {
    initializePatrolDrone(patrolPath);

    const first = tickPatrolDrone({
      liveAssets: [],
      deltaSeconds: 1,
      patrolPath,
    });
    const second = tickPatrolDrone({
      liveAssets: [],
      deltaSeconds: 1,
      patrolPath,
    });

    expect(first?.id).toBe(PATROL_ASSET_ID);
    expect(first?.role).toBe("drone");
    expect(first?.drone?.patrol?.mode).toBe("patrol");
    expect(second?.lat).not.toBe(first?.lat);
  });

  it("realigns onto a replaced route without teleporting to the start", () => {
    initializePatrolDrone(patrolPath);

    tickPatrolDrone({ liveAssets: [], deltaSeconds: 60, patrolPath });
    tickPatrolDrone({ liveAssets: [], deltaSeconds: 60, patrolPath });

    const beforeReplace = getPatrolDroneState(PATROL_ASSET_ID);
    expect(beforeReplace).toBeDefined();

    const replacementPath: ResolvedPatrolPath = {
      id: 2,
      geojson: {
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
          coordinates: [
            [-76.0, 45.1],
            [-75.9, 45.15],
            [-75.8, 45.2],
          ],
        },
      },
    };

    initializePatrolDrone(replacementPath);

    const afterReplace = getPatrolDroneState(PATROL_ASSET_ID);

    expect(afterReplace?.asset.lat).toBeCloseTo(beforeReplace!.asset.lat, 5);
    expect(afterReplace?.asset.lon).toBeCloseTo(beforeReplace!.asset.lon, 5);
    expect(afterReplace?.asset.lat).not.toBeCloseTo(45.1, 3);
    expect(afterReplace?.asset.lon).not.toBeCloseTo(-76.0, 3);
  });
});
