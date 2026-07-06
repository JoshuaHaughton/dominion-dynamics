import { describe, expect, it } from "vitest";
import type { Asset } from "@dominion-dynamics/shared";
import {
  formatDispatchBaseLabel,
  formatDispatchFocusField,
  formatDispatchFocusValue,
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

describe("formatDispatchPhase", () => {
  it("maps wire phases to operator-facing labels", () => {
    expect(formatDispatchPhase("rtb")).toBe("RTB");
    expect(formatDispatchPhase("trailing")).toBe("Trailing");
  });
});

describe("formatDispatchBaseLabel", () => {
  it("uses patrol route for patrol-origin assignments", () => {
    expect(formatDispatchBaseLabel("patrol", "CYOW")).toBe(
      PATROL_ROUTE_BASE_LABEL,
    );
  });

  it("uses the airport ident for airport-born dispatch drones", () => {
    expect(formatDispatchBaseLabel("dispatch", "CYOW")).toBe("CYOW");
  });
});

describe("formatDispatchFocusValue", () => {
  it("shows the target callsign while chasing", () => {
    expect(
      formatDispatchFocusValue("trailing", trafficAsset.id, "CYOW", [
        trafficAsset,
      ]),
    ).toBe("UAL123");
  });

  it("shows the home airport ident during RTB", () => {
    expect(formatDispatchFocusValue("rtb", "", "CYRO", [])).toBe("CYRO");
  });

  it("shows patrol route during patrol-origin RTB", () => {
    expect(
      formatDispatchFocusValue("rtb", "", "", [], "patrol"),
    ).toBe(PATROL_ROUTE_BASE_LABEL);
  });
});

describe("formatDispatchFocusField", () => {
  it("switches the label during RTB", () => {
    expect(formatDispatchFocusField("rtb")).toBe("Returning to");
    expect(formatDispatchFocusField("trailing")).toBe("Target");
  });
});
