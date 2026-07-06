import { describe, expect, it } from "vitest";
import { PATROL_ASSET_ID } from "@dominion-dynamics/shared";
import { publishLiveSnapshot } from "./publishLiveSnapshot.js";
import { getAssetList } from "../sim/store.js";
import { testAsset } from "../../testFixtures/asset.js";

describe("publishLiveSnapshot", () => {
  it("merges multiple drones into one snapshot", () => {
    const traffic = testAsset({
      id: "syn-1",
      lat: 45.4,
      lon: -75.7,
      alt: 5000,
      heading: 90,
      speed: 100,
    });
    const patrol = testAsset({
      id: PATROL_ASSET_ID,
      lat: 45.35,
      lon: -75.65,
      alt: 500,
      heading: 180,
      speed: 80,
      role: "drone",
      zone: null,
      drone: {
        origin: "patrol",
        patrol: { mode: "patrol", shadowTargetId: null },
      },
    });
    const dispatch = testAsset({
      id: "c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      lat: 45.3225,
      lon: -75.6692,
      alt: 500,
      heading: 45,
      speed: 120,
      role: "drone",
      callsign: "SCRAM1",
      zone: null,
      drone: {
        origin: "dispatch",
        dispatch: {
          targetId: "syn-1",
          phase: "enroute",
          homeAirportIdent: "CYOW",
        },
      },
    });

    const snapshot = publishLiveSnapshot({
      traffic: [traffic],
      drones: [patrol, dispatch],
    });

    expect(snapshot).toHaveLength(3);
    expect(snapshot.map((asset) => asset.id)).toEqual([
      "syn-1",
      PATROL_ASSET_ID,
      "c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    ]);
    expect(getAssetList()).toHaveLength(3);
  });
});
