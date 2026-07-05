import bearing from "@turf/bearing";
import destination from "@turf/destination";
import distance from "@turf/distance";
import { point } from "@turf/helpers";
import type {
  Asset,
  AssetHistoryPoint,
  PredictedPathLine,
} from "@dominion-dynamics/shared";
import { WARNING_WINDOW_SECONDS } from "./constants.js";

type MotionVector = Pick<Asset, "heading" | "speed">;

/** Derive heading and speed from up to five minutes of history, else the live asset. */
function deriveMotion(
  asset: Asset,
  history: readonly AssetHistoryPoint[],
): MotionVector {
  if (history.length < 2 || asset.speed <= 0) {
    return { heading: asset.heading, speed: asset.speed };
  }

  const first = history[0]!;
  const last = history.at(-1)!;
  const elapsedSeconds = (last.ts - first.ts) / 1000;

  if (elapsedSeconds <= 0) {
    return { heading: asset.heading, speed: asset.speed };
  }

  const start = point([first.lon, first.lat]);
  const end = point([last.lon, last.lat]);
  const pathKm = distance(start, end, { units: "kilometers" });
  const speed = (pathKm * 1000) / elapsedSeconds;

  if (speed <= 0) {
    return { heading: asset.heading, speed: asset.speed };
  }

  return {
    heading: bearing(start, end),
    speed,
  };
}

/** Project a straight-line path forward for the five-minute warning window. */
export function predictAssetPath(
  asset: Asset,
  history: readonly AssetHistoryPoint[],
): PredictedPathLine {
  const { heading, speed } = deriveMotion(asset, history);
  const origin = point([asset.lon, asset.lat]);

  if (speed <= 0) {
    return {
      type: "LineString",
      coordinates: [
        [asset.lon, asset.lat],
        [asset.lon, asset.lat],
      ],
    };
  }

  const distanceKm = (speed * WARNING_WINDOW_SECONDS) / 1000;
  const end = destination(origin, distanceKm, heading, { units: "kilometers" });
  const [endLon, endLat] = end.geometry.coordinates;

  return {
    type: "LineString",
    coordinates: [
      [asset.lon, asset.lat],
      [endLon, endLat],
    ],
  };
}
