import { describe, expect, it } from "vitest";
import { requireNearestAirport, findAirportByIdent } from "./registry.js";

describe("airport registry", () => {
  it("loads major ICAO airports from the bundled registry", () => {
    expect(findAirportByIdent("CYOW")?.name).toContain("Ottawa");
    expect(findAirportByIdent("KLAX")?.name).toContain("Los Angeles");
  });

  it("looks up by ident in O(1) via prebuilt map", () => {
    expect(findAirportByIdent("cyow")?.ident).toBe("CYOW");
    expect(findAirportByIdent("  klax ")).toMatchObject({ ident: "KLAX" });
    expect(findAirportByIdent("NOPE")).toBeUndefined();
  });

  it.each([
    {
      place: "Ottawa International",
      lat: 45.3225,
      lon: -75.6692,
      ident: "CYOW",
    },
    {
      place: "downtown Ottawa where Rockcliffe is closer than CYOW",
      lat: 45.4215,
      lon: -75.6972,
      ident: "CYRO",
    },
    {
      place: "Los Angeles International",
      lat: 33.9416,
      lon: -118.4085,
      ident: "KLAX",
    },
    { place: "Heathrow", lat: 51.47, lon: -0.4543, ident: "EGLL" },
  ])("returns $ident for a point near $place", ({ lat, lon, ident }) => {
    expect(requireNearestAirport(lat, lon).ident).toBe(ident);
  });

  it("excludes private strips from the bundled registry", () => {
    expect(findAirportByIdent("CA-1254")).toBeUndefined();
  });

  it("returns an ICAO airport east of Ottawa instead of a private strip", () => {
    const nearest = requireNearestAirport(45.37, -75.41);

    expect(nearest.ident).toMatch(/^[A-Z]{4}$/);
    expect(nearest.ident).not.toBe("CA-1254");
  });
});
