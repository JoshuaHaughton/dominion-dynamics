import { describe, expect, it } from "vitest";
import { UNEVALUATED_THREAT } from "@dominion-dynamics/shared";
import {
  OPEN_SKY_STATE_FIXTURES,
} from "./fixtures.js";
import { mapOpenSkyStateToAsset } from "./mapStateVector.js";

describe("mapOpenSkyStateToAsset", () => {
  it("maps a commercial in-flight row to an opensky asset", () => {
    const asset = mapOpenSkyStateToAsset(
      OPEN_SKY_STATE_FIXTURES.commercialInFlight,
    );

    expect(asset).toEqual({
      id: "c0ffee",
      lat: 45.42,
      lon: -75.67,
      alt: 10_668,
      heading: 275,
      speed: 230.5,
      source: "opensky",
      ...UNEVALUATED_THREAT,
    });
  });

  it("maps slow rotorcraft and low-altitude drone rows", () => {
    expect(mapOpenSkyStateToAsset(OPEN_SKY_STATE_FIXTURES.rotorcraftHover)).toEqual({
      id: "abc123",
      lat: 45.38,
      lon: -75.71,
      alt: 300,
      heading: 90,
      speed: 12,
      source: "opensky",
      ...UNEVALUATED_THREAT,
    });

    expect(mapOpenSkyStateToAsset(OPEN_SKY_STATE_FIXTURES.drone)).toEqual({
      id: "drone01",
      lat: 45.35,
      lon: -75.75,
      alt: 120,
      heading: 180,
      speed: 18,
      source: "opensky",
      ...UNEVALUATED_THREAT,
    });
  });

  it("maps on-ground rows with zero speed", () => {
    expect(mapOpenSkyStateToAsset(OPEN_SKY_STATE_FIXTURES.onGround)).toMatchObject({
      id: "parked1",
      speed: 0,
      source: "opensky",
    });
  });

  it("returns null for rows missing position data", () => {
    expect(
      mapOpenSkyStateToAsset(OPEN_SKY_STATE_FIXTURES.sparseNulls),
    ).toBeNull();
  });
});
