import { describe, expect, it } from "vitest";
import type { Asset, DispatchPhase } from "@dominion-dynamics/shared";
import { getActiveInterceptMissions } from "./interceptPanelUtils.js";

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

describe("getActiveInterceptMissions", () => {
  it("returns an empty list when no drones are on dispatch", () => {
    expect(getActiveInterceptMissions([trafficAsset])).toEqual([]);
  });

  it("derives one mission row from a dispatch drone asset", () => {
    const missions = getActiveInterceptMissions([
      trafficAsset,
      dispatchDrone(
        "dispatch-1",
        "Dispatch-1",
        "dispatch",
        trafficAsset.id,
        "enroute",
        "CYOW",
      ),
    ]);

    expect(missions).toEqual([
      {
        droneId: "dispatch-1",
        droneLabel: "Dispatch-1",
        focusFieldLabel: "Target",
        focusLabel: "UAL123",
        phase: "enroute",
        phaseLabel: "En route",
        baseLabel: "CYOW",
      },
    ]);
  });

  it("shows the home airport ident during RTB", () => {
    const missions = getActiveInterceptMissions([
      dispatchDrone("dispatch-1", "Dispatch-1", "dispatch", "", "rtb", "CYRO"),
    ]);

    expect(missions[0]?.focusFieldLabel).toBe("Returning to");
    expect(missions[0]?.focusLabel).toBe("CYRO");
  });

  it("shows patrol route as the base label for patrol-origin rows", () => {
    const missions = getActiveInterceptMissions([
      dispatchDrone(
        "patrol-1",
        "PATROL1",
        "patrol",
        trafficAsset.id,
        "intercepting",
        "CYRO",
      ),
    ]);

    expect(missions[0]?.baseLabel).toBe("Patrol route");
    expect(missions[0]?.droneLabel).toBe("PATROL1");
  });

  it("shows patrol route as the RTB focus label for patrol-origin rows", () => {
    const missions = getActiveInterceptMissions([
      dispatchDrone("patrol-1", "PATROL1", "patrol", "", "rtb", ""),
    ]);

    expect(missions[0]?.focusFieldLabel).toBe("Returning to");
    expect(missions[0]?.focusLabel).toBe("Patrol route");
    expect(missions[0]?.baseLabel).toBe("Patrol route");
  });
});
