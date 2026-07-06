import type { Asset } from "@dominion-dynamics/shared";
import { DRONE_ICAO_CATEGORY } from "@dominion-dynamics/shared";
import { PATROL_DRONE_ALT_M } from "../patrol/constants.js";

type BuildDroneAssetParams = {
  id: string;
  callsign: string;
  lat: number;
  lon: number;
  heading: number;
  speed: number;
};

/** Base wire asset for any simulated drone (patrol or dispatch). */
export function buildDroneAsset({
  id,
  callsign,
  lat,
  lon,
  heading,
  speed,
}: BuildDroneAssetParams): Asset {
  return {
    id,
    lat,
    lon,
    alt: PATROL_DRONE_ALT_M,
    heading,
    speed,
    role: "drone",
    category: DRONE_ICAO_CATEGORY,
    callsign,
    originCountry: null,
    onGround: false,
    zone: null,
  };
}
