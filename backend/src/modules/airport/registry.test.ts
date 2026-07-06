import { describe, expect, it } from "vitest";
import { findNearestAirport, getAirportByIdent } from "./registry.js";

describe("airport registry", () => {
  it("loads major ICAO airports from the bundled registry", () => {
    expect(getAirportByIdent("CYOW")?.name).toContain("Ottawa");
    expect(getAirportByIdent("KLAX")?.name).toContain("Los Angeles");
  });

  it("looks up by ident in O(1) via prebuilt map", () => {
    expect(getAirportByIdent("cyow")?.ident).toBe("CYOW");
    expect(getAirportByIdent("  klax ")).toMatchObject({ ident: "KLAX" });
    expect(getAirportByIdent("NOPE")).toBeUndefined();
  });

  it("returns CYOW for a point at Ottawa International", () => {
    expect(findNearestAirport(45.3225, -75.6692).ident).toBe("CYOW");
  });

  it("returns CYRO for downtown Ottawa where Rockcliffe is closer than CYOW", () => {
    expect(findNearestAirport(45.4215, -75.6972).ident).toBe("CYRO");
  });

  it("returns KLAX for a point near Los Angeles International", () => {
    expect(findNearestAirport(33.9416, -118.4085).ident).toBe("KLAX");
  });

  it("returns EGLL for a point near Heathrow", () => {
    expect(findNearestAirport(51.47, -0.4543).ident).toBe("EGLL");
  });

  it("excludes private strips from the bundled registry", () => {
    expect(getAirportByIdent("CA-1254")).toBeUndefined();
  });

  it("returns an ICAO airport east of Ottawa instead of a private strip", () => {
    const nearest = findNearestAirport(45.37, -75.41);

    expect(nearest.ident).toMatch(/^[A-Z]{4}$/);
    expect(nearest.ident).not.toBe("CA-1254");
  });
});
