import { describe, expect, it } from "vitest";
import type { Asset, DispatchPhase } from "@dominion-dynamics/shared";
import { PATROL_ASSET_ID } from "@dominion-dynamics/shared";
import {
  buildDispatchMissionRow,
  formatDispatchPhase,
  PATROL_ROUTE_BASE_LABEL,
} from "./dispatchDisplayUtils.js";

const trafficAsset: Asset = {
  id: "syn-7033aa39-4da1-495d-89f9-13c43a7677ad",
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

describe("formatDispatchPhase", () => {
  it("maps wire phases to operator-facing labels", () => {
    expect(formatDispatchPhase("enroute")).toBe("En-route");
    expect(formatDispatchPhase("rtb")).toBe("RTB");
    expect(formatDispatchPhase("trailing")).toBe("Trailing");
  });
});

describe("buildDispatchMissionRow", () => {
  it("returns null for non-dispatch assets", () => {
    expect(buildDispatchMissionRow(trafficAsset, [trafficAsset])).toBeNull();
  });

  it("derives one mission row from a dispatch drone asset", () => {
    expect(
      buildDispatchMissionRow(
        dispatchDrone(
          "dispatch-1",
          "Dispatch-1",
          "dispatch",
          trafficAsset.id,
          "enroute",
          "CYOW",
        ),
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
      ),
    ).toEqual({
      assetId: "dispatch-1",
      droneLabel: "Dispatch-1",
      focusFieldLabel: "Target",
      focusLabel: "UAL123",
      phaseLabel: "En-route",
      baseLabel: "CYOW",
    });
  });

  it("shows patrol route as the base label for patrol-origin rows", () => {
    const row = buildDispatchMissionRow(
      dispatchDrone(
        PATROL_ASSET_ID,
        "PATROL1",
        "patrol",
        trafficAsset.id,
        "intercepting",
        "CYRO",
      ),
      [trafficAsset],
    );

    expect(row?.baseLabel).toBe(PATROL_ROUTE_BASE_LABEL);
  });
});
