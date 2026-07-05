import destination from "@turf/destination";
import { point } from "@turf/helpers";
import type { Asset } from "@dominion-dynamics/shared";

export type StepAssetParams = {
  asset: Asset;
  /** Seconds elapsed since the previous tick. */
  deltaSeconds: number;
};

/**
 * Advance one asset along its heading for this tick.
 * Uses @turf/destination (spherical geodesic) instead of a flat 111320 m/deg
 * estimate so movement matches the same geo model we'll use for zones and TTE.
 */
export function stepAsset({ asset, deltaSeconds }: StepAssetParams): Asset {
  const distanceKm = (asset.speed * deltaSeconds) / 1000;

  // GeoJSON order is [lon, lat]. Bearing is degrees clockwise from north.
  const moved = destination(
    point([asset.lon, asset.lat]),
    distanceKm,
    asset.heading,
    { units: "kilometers" },
  );

  const [lon, lat] = moved.geometry.coordinates;

  return { ...asset, lat, lon };
}
