import type { Asset } from "@dominion-dynamics/shared";
import { DEFAULT_TRAFFIC_ZONE } from "../modules/threat/constants.js";

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
    zone: DEFAULT_TRAFFIC_ZONE,
    ...overrides,
  };
}
