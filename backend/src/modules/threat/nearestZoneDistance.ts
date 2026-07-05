import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import { point } from "@turf/helpers";
import pointToLineDistance from "@turf/point-to-line-distance";
import polygonToLine from "@turf/polygon-to-line";
import type { Asset } from "@dominion-dynamics/shared";
import type {
  Feature,
  FeatureCollection,
  LineString,
  MultiLineString,
  Point,
} from "geojson";
import type { CachedZone } from "./types.js";

function isBoundaryFeature(
  boundary: Feature<LineString | MultiLineString> | FeatureCollection<LineString | MultiLineString>,
): boundary is Feature<LineString | MultiLineString> {
  return boundary.type === "Feature";
}

function boundaryDistanceKm(
  assetPoint: Feature<Point>,
  boundary: Feature<LineString | MultiLineString>,
): number {
  const geometry = boundary.geometry;

  if (geometry.type === "LineString") {
    return pointToLineDistance(assetPoint, boundary as Feature<LineString>, {
      units: "kilometers",
    });
  }

  let nearestKm: number | null = null;

  for (const coordinates of geometry.coordinates) {
    const segment: Feature<LineString> = {
      type: "Feature",
      properties: {},
      geometry: { type: "LineString", coordinates },
    };
    const distanceKm = pointToLineDistance(assetPoint, segment, {
      units: "kilometers",
    });

    if (nearestKm === null || distanceKm < nearestKm) {
      nearestKm = distanceKm;
    }
  }

  return nearestKm ?? 0;
}

/** Shortest distance in meters from the asset to any restricted zone boundary. */
export function nearestZoneDistanceM(
  asset: Pick<Asset, "lat" | "lon">,
  zones: readonly CachedZone[],
): number | null {
  if (zones.length === 0) {
    return null;
  }

  const assetPoint = point([asset.lon, asset.lat]);
  let nearestM: number | null = null;

  for (const zone of zones) {
    if (booleanPointInPolygon(assetPoint, zone.polygon)) {
      return 0;
    }

    const boundary = polygonToLine(zone.polygon);
    let distanceKm: number;

    if (isBoundaryFeature(boundary)) {
      distanceKm = boundaryDistanceKm(assetPoint, boundary);
    } else {
      let nearestKm: number | null = null;

      for (const feature of boundary.features) {
        const segmentKm = boundaryDistanceKm(assetPoint, feature);

        if (nearestKm === null || segmentKm < nearestKm) {
          nearestKm = segmentKm;
        }
      }

      distanceKm = nearestKm ?? 0;
    }

    const distanceM = distanceKm * 1000;

    if (nearestM === null || distanceM < nearestM) {
      nearestM = distanceM;
    }
  }

  return nearestM;
}
