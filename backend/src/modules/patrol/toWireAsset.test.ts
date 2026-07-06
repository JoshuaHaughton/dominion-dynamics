import { describe, expect, it } from "vitest";
import { PATROL_ASSET_ID } from "@dominion-dynamics/shared";
import { testAsset } from "@dominion-dynamics/shared/testing";
import { patrolAssetFromState } from "./toWireAsset.js";
import type { PatrolDroneState } from "./types.js";

describe("patrolAssetFromState", () => {
  function patrolState(
    overrides: Partial<PatrolDroneState> = {},
  ): PatrolDroneState {
    return {
      mode: "patrol",
      targetWaypointIndex: 0,
      pathDirection: "forward",
      shadowTargetId: null,
      pathId: 2,
      rejoinTarget: null,
      asset: testAsset({ id: PATROL_ASSET_ID, role: "drone" }),
      ...overrides,
    };
  }

  it("merges patrol sim fields onto a drone wire asset", () => {
    const wire = patrolAssetFromState(
      patrolState({ mode: "shadow", shadowTargetId: "traffic-1" }),
    );

    expect(wire.role).toBe("drone");
    expect(wire.zone).toBeNull();
    expect(wire.drone).toEqual({
      origin: "patrol",
      patrol: { mode: "shadow", shadowTargetId: "traffic-1", pathId: 2 },
    });
  });

  it("omits pathId from the wire shape when no route is assigned", () => {
    const wire = patrolAssetFromState(patrolState({ pathId: null }));

    expect(wire.drone?.patrol).toEqual({
      mode: "patrol",
      shadowTargetId: null,
    });
    expect(wire.drone?.patrol).not.toHaveProperty("pathId");
  });
});
