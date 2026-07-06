import { describe, expect, it } from "vitest";
import type { Asset, DispatchPhase } from "@dominion-dynamics/shared";
import {
  formatAirportLabel,
  formatDispatchPhase,
  formatDroneKindLabel,
  formatReadableAssetId,
  getActiveInterceptMissions,
  resolveAssetLabel,
} from "./interceptPanelUtils.js";

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
  homeAirportName?: string,
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
        homeAirportName,
      },
    },
  };
}

describe("formatReadableAssetId", () => {
  it("shortens long synthetic ids", () => {
    expect(formatReadableAssetId("syn-7033aa39-4da1-495d-89f9-13c43a7677ad")).toBe(
      "syn-…77ad",
    );
  });

  it("keeps short ids unchanged", () => {
    expect(formatReadableAssetId("syn-1")).toBe("syn-1");
  });
});

describe("resolveAssetLabel", () => {
  it("returns callsign when the asset has one", () => {
    expect(resolveAssetLabel(trafficAsset.id, [trafficAsset])).toBe("UAL123");
  });

  it("falls back to a shortened id when callsign is missing", () => {
    expect(
      resolveAssetLabel("syn-7033aa39-4da1-495d-89f9-13c43a7677ad", []),
    ).toBe("syn-…77ad");
  });
});

describe("formatDispatchPhase", () => {
  it("maps wire phases to operator-facing labels", () => {
    expect(formatDispatchPhase("enroute")).toBe("En route");
    expect(formatDispatchPhase("rtb")).toBe("RTB");
  });
});

describe("formatDroneKindLabel", () => {
  it("distinguishes airport launches from patrol assignments", () => {
    expect(formatDroneKindLabel("dispatch")).toBe("Airport launch");
    expect(formatDroneKindLabel("patrol")).toBe("Patrol route");
  });
});

describe("formatAirportLabel", () => {
  it("includes the registry name when available", () => {
    expect(
      formatAirportLabel("CYOW", "Ottawa Macdonald-Cartier International Airport"),
    ).toBe("Ottawa Macdonald-Cartier International Airport (CYOW)");
  });
});

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
        "Ottawa Macdonald-Cartier International Airport",
      ),
    ]);

    expect(missions).toEqual([
      {
        droneId: "dispatch-1",
        droneKindLabel: "Airport launch",
        droneLabel: "Dispatch-1",
        focusFieldLabel: "Target",
        focusLabel: "UAL123",
        phase: "enroute",
        phaseLabel: "En route",
        homeAirportIdent: "CYOW",
      },
    ]);
  });

  it("shows the return airport during RTB instead of an empty target", () => {
    const missions = getActiveInterceptMissions([
      dispatchDrone(
        "dispatch-1",
        "Dispatch-1",
        "dispatch",
        "",
        "rtb",
        "CYOW",
        "Ottawa Macdonald-Cartier International Airport",
      ),
    ]);

    expect(missions[0]?.focusFieldLabel).toBe("Returning to");
    expect(missions[0]?.focusLabel).toContain("CYOW");
  });

  it("labels patrol-origin dispatch rows separately", () => {
    const missions = getActiveInterceptMissions([
      dispatchDrone(
        "patrol-1",
        "PATROL1",
        "patrol",
        trafficAsset.id,
        "intercepting",
        "CYRO",
        "Ottawa / Rockcliffe Airport",
      ),
    ]);

    expect(missions[0]?.droneKindLabel).toBe("Patrol route");
    expect(missions[0]?.droneLabel).toBe("PATROL1");
  });
});
