import type { Asset } from "@dominion-dynamics/shared";

/** Minimal synthetic asset for backend unit tests. */
export function testAsset(
  overrides: Partial<Asset> & Pick<Asset, "id" | "lat" | "lon" | "alt" | "heading" | "speed">,
): Asset {
  return {
    role: "traffic",
    category: 0,
    callsign: null,
    originCountry: null,
    onGround: false,
    threat: "normal",
    tteSeconds: null,
    nearestZoneDistanceM: null,
    ...overrides,
  };
}
