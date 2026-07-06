import { describe, expect, it } from "vitest";
import {
  testDispatchDrone,
  testPatrolDrone,
  testTrafficAsset,
} from "@dominion-dynamics/shared/testing";
import {
  assetMatchesOperationsFilter,
  deriveAssetSymbology,
  mapEmphasisForAsset,
  symbologyBodyKey,
  symbologyMarkerShape,
  symbologyRingKey,
} from "./assetSymbology.js";

describe("assetSymbology", () => {
  const trafficCritical = testTrafficAsset({
    zone: { threat: "critical", zoneTteSeconds: null, nearestBoundaryM: 0 },
  });

  const patrolDrone = testPatrolDrone(
    { callsign: null },
    { mode: "shadow", shadowTargetId: "traffic-1", pathId: 1 },
  );

  const dispatchDrone = testDispatchDrone();

  describe("deriveAssetSymbology", () => {
    it("maps traffic threat levels", () => {
      expect(deriveAssetSymbology(trafficCritical)).toEqual({
        kind: "traffic",
        threat: "critical",
      });
    });

    it("maps patrol drones by patrol mode", () => {
      expect(deriveAssetSymbology(patrolDrone)).toEqual({
        kind: "patrol",
        mode: "shadow",
      });
    });

    it("maps dispatch drones by phase and patrol diversion", () => {
      expect(deriveAssetSymbology(dispatchDrone)).toEqual({
        kind: "dispatch",
        phase: "trailing",
        divertedFromPatrol: false,
      });
    });
  });

  describe("symbology keys", () => {
    it("builds stable body and shape keys", () => {
      const symbology = deriveAssetSymbology(dispatchDrone);

      expect(symbologyBodyKey(symbology)).toBe("dispatch:trailing");
      expect(symbologyMarkerShape(symbology)).toBe("square");
      expect(symbologyMarkerShape(deriveAssetSymbology(patrolDrone))).toBe(
        "square",
      );
      expect(symbologyMarkerShape(deriveAssetSymbology(trafficCritical))).toBe(
        "circle",
      );
    });
  });

  describe("symbologyRingKey", () => {
    const assetsById = new Map([
      [trafficCritical.id, trafficCritical],
      [patrolDrone.id, patrolDrone],
      [dispatchDrone.id, dispatchDrone],
    ]);

    it("uses critical red when tracking a critical target", () => {
      expect(symbologyRingKey(patrolDrone, assetsById)).toBe(
        "drone-ring:critical-target",
      );
      expect(symbologyRingKey(dispatchDrone, assetsById)).toBe(
        "drone-ring:critical-target",
      );

      expect(
        symbologyRingKey(
          {
            ...dispatchDrone,
            drone: {
              origin: "dispatch",
              dispatch: {
                targetId: trafficCritical.id,
                phase: "enroute",
                homeAirportIdent: "CYOW",
              },
            },
          },
          assetsById,
        ),
      ).toBe("drone-ring:critical-target");
    });

    it("uses default gray for idle patrol drones", () => {
      expect(
        symbologyRingKey(
          {
            ...patrolDrone,
            drone: {
              origin: "patrol",
              patrol: { mode: "patrol", shadowTargetId: null, pathId: 1 },
            },
          },
          assetsById,
        ),
      ).toBe("drone-ring:default");
    });

    it("uses returning gray for rtb and rejoin", () => {
      expect(
        symbologyRingKey(
          {
            ...dispatchDrone,
            drone: {
              origin: "dispatch",
              dispatch: {
                targetId: trafficCritical.id,
                phase: "rtb",
                homeAirportIdent: "CYOW",
              },
            },
          },
          assetsById,
        ),
      ).toBe("drone-ring:returning");

      expect(
        symbologyRingKey(
          {
            ...patrolDrone,
            drone: {
              origin: "patrol",
              patrol: { mode: "rejoin", shadowTargetId: null, pathId: 1 },
            },
          },
          assetsById,
        ),
      ).toBe("drone-ring:returning");
    });
  });

  describe("assetMatchesOperationsFilter", () => {
    it("filters traffic by threat chip", () => {
      expect(
        assetMatchesOperationsFilter(trafficCritical, "traffic", "critical"),
      ).toBe(true);
      expect(
        assetMatchesOperationsFilter(trafficCritical, "traffic", "warning"),
      ).toBe(false);
    });

    it("filters missions by dispatch phase", () => {
      expect(
        assetMatchesOperationsFilter(dispatchDrone, "missions", "trailing"),
      ).toBe(true);
      expect(
        assetMatchesOperationsFilter(dispatchDrone, "missions", "enroute"),
      ).toBe(false);
    });
  });

  describe("mapEmphasisForAsset", () => {
    it("keeps selected assets fully emphasized", () => {
      expect(
        mapEmphasisForAsset(
          trafficCritical,
          {
            entityTab: "missions",
            statusFilter: "all",
            selectedAssetId: "traffic-1",
          },
          0.65,
          0.85,
        ),
      ).toEqual({
        opacity: 1,
        radiusScale: 1.15,
        strokeWidth: 3.5,
      });
    });

    it("does not ghost assets when the chip is All", () => {
      expect(
        mapEmphasisForAsset(
          trafficCritical,
          {
            entityTab: "missions",
            statusFilter: "all",
            selectedAssetId: null,
          },
          0.65,
          0.85,
        ).opacity,
      ).toBe(1);
    });

    it("ghosts non-matching assets when a specific chip is active", () => {
      expect(
        mapEmphasisForAsset(
          trafficCritical,
          {
            entityTab: "missions",
            statusFilter: "trailing",
            selectedAssetId: null,
          },
          0.65,
          0.85,
        ),
      ).toEqual({
        opacity: 0.65,
        radiusScale: 0.85,
        strokeWidth: 0.5,
      });
    });
  });
});
