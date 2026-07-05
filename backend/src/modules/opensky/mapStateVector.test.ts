import { describe, expect, it } from "vitest";
import { OPEN_SKY_STATE_FIXTURES } from "./fixtures.js";
import { mapOpenSkyStateToAsset } from "./mapStateVector.js";

describe("mapOpenSkyStateToAsset", () => {
  const unevaluatedThreat = {
    threat: "normal" as const,
    zoneTteSeconds: null,
    nearestZoneDistanceM: null,
  };

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
      role: "traffic",
      category: 4,
      callsign: "ACA123",
      originCountry: "Canada",
      onGround: false,
      ...unevaluatedThreat,
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
      role: "traffic",
      category: 8,
      callsign: "CFCO",
      originCountry: "Canada",
      onGround: false,
      ...unevaluatedThreat,
    });

    expect(mapOpenSkyStateToAsset(OPEN_SKY_STATE_FIXTURES.drone)).toEqual({
      id: "drone01",
      lat: 45.35,
      lon: -75.75,
      alt: 120,
      heading: 180,
      speed: 18,
      role: "traffic",
      category: 14,
      callsign: null,
      originCountry: "Canada",
      onGround: false,
      ...unevaluatedThreat,
    });
  });

  it("maps on-ground rows with zero speed", () => {
    expect(mapOpenSkyStateToAsset(OPEN_SKY_STATE_FIXTURES.onGround)).toMatchObject({
      id: "parked1",
      speed: 0,
      role: "traffic",
      category: 3,
      callsign: "WJA456",
      originCountry: "Canada",
      onGround: true,
    });
  });

  it("returns null for rows missing position data", () => {
    expect(
      mapOpenSkyStateToAsset(OPEN_SKY_STATE_FIXTURES.sparseNulls),
    ).toBeNull();
  });
});
