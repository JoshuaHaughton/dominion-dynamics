import { describe, expect, it } from "vitest";
import type { Asset, DispatchPhase } from "@dominion-dynamics/shared";
import { PATROL_ASSET_ID } from "@dominion-dynamics/shared";
import {
  buildOperationsRows,
  buildPinnedPatrolRow,
  countAssetsForTab,
} from "./operationsPanelUtils.js";

const trafficAsset: Asset = {
  id: "7033aa39-4da1-495d-89f9-13c43a7677ad",
  lat: 45.4,
  lon: -75.7,
  alt: 1000,
  heading: 90,
  speed: 120,
  role: "traffic",
  category: 0,
  callsign: "UAL123",
  originCountry: null,
  onGround: false,
  zone: { threat: "critical", zoneTteSeconds: null, nearestBoundaryM: 0 },
};

function dispatchDrone(
  id: string,
  callsign: string,
  origin: "dispatch" | "patrol",
  targetId: string,
  phase: DispatchPhase,
  homeAirportIdent: string,
): Asset {
  return {
    id,
    lat: 45.32,
    lon: -75.67,
    alt: 500,
    heading: 45,
    speed: 80,
    role: "drone",
    category: 14,
    callsign,
    originCountry: null,
    onGround: false,
    zone: null,
    drone: {
      origin,
      dispatch: {
        targetId,
        phase,
        homeAirportIdent,
      },
    },
  };
}

const patrolDrone: Asset = {
  id: PATROL_ASSET_ID,
  lat: 45.35,
  lon: -75.65,
  alt: 500,
  heading: 45,
  speed: 80,
  role: "drone",
  category: 14,
  callsign: "Patrol-1",
  originCountry: null,
  onGround: false,
  zone: null,
  drone: {
    origin: "patrol",
    patrol: { mode: "shadow", shadowTargetId: trafficAsset.id, pathId: 1 },
  },
};

describe("countAssetsForTab", () => {
  it("counts entities per tab", () => {
    const assets = [
      trafficAsset,
      patrolDrone,
      dispatchDrone(
        "dispatch-1",
        "Dispatch-1",
        "dispatch",
        trafficAsset.id,
        "enroute",
        "CYOW",
      ),
    ];

    expect(countAssetsForTab(assets, "traffic")).toBe(1);
    expect(countAssetsForTab(assets, "drones")).toBe(2);
    expect(countAssetsForTab(assets, "missions")).toBe(1);
  });
});

describe("buildOperationsRows", () => {
  it("builds mission rows from dispatch drones", () => {
    const rows = buildOperationsRows(
      [
        trafficAsset,
        dispatchDrone(
          "dispatch-1",
          "Dispatch-1",
          "dispatch",
          trafficAsset.id,
          "enroute",
          "CYOW",
        ),
      ],
      "missions",
      "all",
    );

    expect(rows).toEqual([
      {
        kind: "mission",
        assetId: "dispatch-1",
        row: {
          assetId: "dispatch-1",
          droneLabel: "Dispatch-1",
          focusFieldLabel: "Target",
          focusLabel: "UAL123",
          phaseLabel: "En-route",
          baseLabel: "CYOW",
        },
      },
    ]);
  });

  it("filters missions by status chip", () => {
    const rows = buildOperationsRows(
      [
        dispatchDrone(
          "dispatch-1",
          "Dispatch-1",
          "dispatch",
          trafficAsset.id,
          "enroute",
          "CYOW",
        ),
        dispatchDrone(
          "dispatch-2",
          "Dispatch-2",
          "dispatch",
          trafficAsset.id,
          "trailing",
          "CYOW",
        ),
      ],
      "missions",
      "trailing",
    );

    expect(rows).toHaveLength(1);
    expect(rows[0]?.assetId).toBe("dispatch-2");
  });

  it("builds drone rows for patrol and dispatch assets", () => {
    const rows = buildOperationsRows(
      [
        trafficAsset,
        patrolDrone,
        dispatchDrone("dispatch-1", "Dispatch-1", "dispatch", "", "rtb", "CYRO"),
      ],
      "drones",
      "all",
    );

    expect(rows).toHaveLength(2);
    expect(rows[0]?.kind).toBe("drone");
    expect(rows[0]?.row).toMatchObject({
      label: "Patrol-1",
      typeLabel: "Patrol",
      statusLabel: "Shadowing",
      taskLabel: "UAL123",
    });
    expect(rows[1]?.row).toMatchObject({
      label: "Dispatch-1",
      typeLabel: "Dispatch",
      statusLabel: "RTB",
      taskLabel: "CYRO",
    });
  });

  it("builds traffic rows with formatted zone fields", () => {
    const rows = buildOperationsRows(
      [
        {
          ...trafficAsset,
          zone: {
            threat: "warning",
            zoneTteSeconds: 125,
            nearestBoundaryM: 1500,
          },
        },
      ],
      "traffic",
      "warning",
    );

    expect(rows[0]?.row).toMatchObject({
      label: "UAL123",
      threatLabel: "Warning",
      tteLabel: "2m 5s",
      nearestLabel: "1.5 km",
    });
  });

  it("builds a pinned patrol row from the singleton patrol asset", () => {
    expect(buildPinnedPatrolRow([patrolDrone])).toMatchObject({
      assetId: PATROL_ASSET_ID,
      row: {
        typeLabel: "Patrol",
        statusLabel: "Shadowing",
      },
    });
  });
});
