import type { Asset } from "@dominion-dynamics/shared";
import { isIcaoEmitterCategory } from "@dominion-dynamics/shared";
import type { OpenSkyStateVector } from "./types.js";
import { OPEN_SKY_STATE_INDEX as I } from "./types.js";

export type MapOpenSkyStateOptions = {
  /** Skip rows without a usable lat/lon fix. Default true. */
  requirePosition?: boolean;
};

/** Map an OpenSky state vector row into a live Asset. Returns null when unusable. */
export function mapOpenSkyStateToAsset(
  state: OpenSkyStateVector,
  options: MapOpenSkyStateOptions = {},
): Asset | null {
  const requirePosition = options.requirePosition ?? true;
  const lat = state[I.latitude];
  const lon = state[I.longitude];

  if (requirePosition && (lat === null || lon === null)) {
    return null;
  }

  if (lat === null || lon === null) {
    return null;
  }

  const baroAltitude = state[I.baroAltitude];
  const geoAltitude = state[I.geoAltitude];
  const alt = baroAltitude ?? geoAltitude ?? 0;
  const speed = state[I.velocity] ?? 0;
  const heading = state[I.trueTrack] ?? 0;
  const rawCategory = state[I.category];
  const category = isIcaoEmitterCategory(rawCategory) ? rawCategory : 0;
  const callsignRaw = state[I.callsign];
  const callsign =
    callsignRaw === null ? null : callsignRaw.trim() || null;

  return {
    id: state[I.icao24].toLowerCase(),
    lat,
    lon,
    alt,
    heading: normalizeHeading(heading),
    speed,
    role: "traffic",
    category,
    callsign,
    originCountry: state[I.originCountry],
    onGround: state[I.onGround],
    threat: "normal",
    zoneTteSeconds: null,
    nearestZoneDistanceM: null,
  };
}

function normalizeHeading(heading: number): number {
  return ((heading % 360) + 360) % 360;
}
