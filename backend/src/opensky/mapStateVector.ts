import type { Asset } from "@dominion-dynamics/shared";
import type { OpenSkyStateVector } from "./types.js";

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
  const [
    icao24,
    ,
    ,
    ,
    ,
    lon,
    lat,
    baroAltitude,
    ,
    velocity,
    trueTrack,
    ,
    ,
    geoAltitude,
  ] = state;

  if (requirePosition && (lat === null || lon === null)) {
    return null;
  }

  if (lat === null || lon === null) {
    return null;
  }

  const alt = baroAltitude ?? geoAltitude ?? 0;
  const speed = velocity ?? 0;
  const heading = trueTrack ?? 0;

  return {
    id: icao24.toLowerCase(),
    lat,
    lon,
    alt,
    heading: normalizeHeading(heading),
    speed,
    source: "opensky",
  };
}

function normalizeHeading(heading: number): number {
  return ((heading % 360) + 360) % 360;
}
