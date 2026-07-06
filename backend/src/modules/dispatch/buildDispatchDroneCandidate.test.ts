import { afterEach, describe, expect, it } from "vitest";
import { PATROL_ASSET_ID } from "@dominion-dynamics/shared";
import { TEST_IDS, testAsset } from "@dominion-dynamics/shared/testing";
import {
  clearPatrolDroneStates,
  setPatrolDroneState,
} from "../patrol/droneStore.js";
import type { PatrolDroneState } from "../patrol/types.js";
import {
  clearDispatchDroneStates,
  setDispatchDroneState,
} from "./dispatchDroneStore.js";
import {
  buildDispatchDroneCandidates,
  resolveExistingAssetForAssignment,
} from "./buildDispatchDroneCandidate.js";
import type { DispatchDroneState } from "./types.js";

describe("buildDispatchDroneCandidates", () => {
  function patrolState(
    overrides: Partial<PatrolDroneState> = {},
  ): PatrolDroneState {
    return {
      mode: "patrol",
      targetWaypointIndex: 0,
      pathDirection: "forward",
      shadowTargetId: null,
      pathId: 1,
      rejoinTarget: null,
      asset: testAsset({ id: PATROL_ASSET_ID, role: "drone", zone: null }),
      ...overrides,
    };
  }

  function dispatchState(
    overrides: Partial<DispatchDroneState> = {},
  ): DispatchDroneState {
    return {
      phase: "enroute",
      targetId: "critical-1",
      assignmentSource: "spawn",
      homeAirportIdent: "CYOW",
      origin: "dispatch",
      asset: testAsset({
        id: TEST_IDS.DISPATCH_DRONE,
        role: "drone",
        zone: null,
      }),
      ...overrides,
    };
  }

  afterEach(() => {
    clearPatrolDroneStates();
    clearDispatchDroneStates();
  });

  it("exposes an on-route patrol drone with its patrol mode and availability", () => {
    setPatrolDroneState(PATROL_ASSET_ID, patrolState({ mode: "shadow" }));

    const candidates = buildDispatchDroneCandidates(() => undefined);

    expect(candidates).toHaveLength(1);
    expect(candidates[0]).toMatchObject({
      droneId: PATROL_ASSET_ID,
      origin: "patrol",
      patrol: { mode: "shadow" },
      availability: "available",
      missionTargetId: null,
      homeAirportIdent: null,
    });
  });

  it("marks the patrol drone busy when it holds a mission", () => {
    setPatrolDroneState(PATROL_ASSET_ID, patrolState());

    const candidates = buildDispatchDroneCandidates((droneId) =>
      droneId === PATROL_ASSET_ID ? "critical-1" : undefined,
    );

    expect(candidates[0]).toMatchObject({
      availability: "busy",
      missionTargetId: "critical-1",
    });
  });

  it("emits a dispatch-owned patrol drone without a patrol field", () => {
    setPatrolDroneState(PATROL_ASSET_ID, patrolState());
    setDispatchDroneState(
      PATROL_ASSET_ID,
      dispatchState({
        origin: "patrol",
        homeAirportIdent: null,
        asset: testAsset({ id: PATROL_ASSET_ID, role: "drone", zone: null }),
      }),
    );

    const candidates = buildDispatchDroneCandidates(() => undefined);

    // The route-side patrol candidate must not appear alongside the
    // dispatch-owned one for the same drone id.
    expect(candidates).toHaveLength(1);
    expect(candidates[0]).toMatchObject({
      droneId: PATROL_ASSET_ID,
      origin: "patrol",
      homeAirportIdent: null,
    });
    expect(candidates[0]).not.toHaveProperty("patrol");
  });

  it("maps dispatch drones with busy/available from the mission map", () => {
    setDispatchDroneState(TEST_IDS.DISPATCH_DRONE, dispatchState());

    const busy = buildDispatchDroneCandidates((droneId) =>
      droneId === TEST_IDS.DISPATCH_DRONE ? "critical-1" : undefined,
    );
    const available = buildDispatchDroneCandidates(() => undefined);

    expect(busy[0]).toMatchObject({
      droneId: TEST_IDS.DISPATCH_DRONE,
      origin: "dispatch",
      availability: "busy",
      missionTargetId: "critical-1",
      homeAirportIdent: "CYOW",
    });
    expect(available[0]).toMatchObject({
      availability: "available",
      missionTargetId: null,
    });
  });

  describe("resolveExistingAssetForAssignment", () => {
    it("prefers the dispatch drone state's asset", () => {
      setDispatchDroneState(TEST_IDS.DISPATCH_DRONE, dispatchState());

      expect(
        resolveExistingAssetForAssignment(TEST_IDS.DISPATCH_DRONE)?.id,
      ).toBe(TEST_IDS.DISPATCH_DRONE);
    });

    it("falls back to the patrol store for the patrol drone id", () => {
      setPatrolDroneState(PATROL_ASSET_ID, patrolState());

      expect(resolveExistingAssetForAssignment(PATROL_ASSET_ID)?.id).toBe(
        PATROL_ASSET_ID,
      );
    });

    it("returns undefined for unknown drones", () => {
      expect(resolveExistingAssetForAssignment("nope")).toBeUndefined();
    });
  });
});
