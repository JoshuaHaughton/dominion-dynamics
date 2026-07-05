import type {
  GeoJSONSource,
  GeoJSONSourceSpecification,
  LineLayerSpecification,
  Map,
} from "maplibre-gl";
import type { AssetTrackDetail, ThreatLevel } from "@dominion-dynamics/shared";
import type { FeatureCollection, LineString } from "geojson";
import {
  ASSET_HISTORY_LINE_OPACITY,
  ASSET_HISTORY_LINE_WIDTH,
  ASSET_PREDICTION_DASHARRAY,
  ASSET_PREDICTION_LINE_WIDTH,
  ASSET_THREAT_COLORS,
  MAP_LAYERS,
} from "../../lib/constants/mapConstants.js";

function emptyLineCollection(): FeatureCollection<LineString> {
  return { type: "FeatureCollection", features: [] };
}

function historyCollection(
  detail: AssetTrackDetail,
): FeatureCollection<LineString> {
  if (detail.history.length < 2) {
    return emptyLineCollection();
  }

  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: { assetId: detail.assetId },
        geometry: {
          type: "LineString",
          coordinates: detail.history.map((point) => [point.lon, point.lat]),
        },
      },
    ],
  };
}

function predictionCollection(
  detail: AssetTrackDetail,
  threat: ThreatLevel,
): FeatureCollection<LineString> {
  const { coordinates } = detail.predictedPath;

  if (coordinates.length < 2) {
    return emptyLineCollection();
  }

  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: { assetId: detail.assetId, threat },
        geometry: {
          type: "LineString",
          coordinates,
        },
      },
    ],
  };
}

const historySource = (
  detail: AssetTrackDetail | null,
): GeoJSONSourceSpecification => ({
  type: "geojson",
  lineMetrics: true,
  data: detail ? historyCollection(detail) : emptyLineCollection(),
});

const predictionSource = (
  detail: AssetTrackDetail | null,
  threat: ThreatLevel,
): GeoJSONSourceSpecification => ({
  type: "geojson",
  data: detail ? predictionCollection(detail, threat) : emptyLineCollection(),
});

const historyLineLayer: LineLayerSpecification = {
  id: MAP_LAYERS.assetHistoryLine,
  type: "line",
  source: MAP_LAYERS.assetHistorySource,
  layout: {
    "line-cap": "round",
    "line-join": "round",
  },
  paint: {
    "line-gradient": [
      "interpolate",
      ["linear"],
      ["line-progress"],
      0,
      "rgba(148, 163, 184, 0)",
      0.15,
      `rgba(148, 163, 184, ${ASSET_HISTORY_LINE_OPACITY * 0.5})`,
      1,
      `rgba(148, 163, 184, ${ASSET_HISTORY_LINE_OPACITY})`,
    ],
    "line-width": ASSET_HISTORY_LINE_WIDTH,
  },
};

const predictionLineLayer: LineLayerSpecification = {
  id: MAP_LAYERS.assetPredictionLine,
  type: "line",
  source: MAP_LAYERS.assetPredictionSource,
  paint: {
    "line-color": [
      "match",
      ["get", "threat"],
      "critical",
      ASSET_THREAT_COLORS.critical,
      "warning",
      ASSET_THREAT_COLORS.warning,
      ASSET_THREAT_COLORS.normal,
    ],
    "line-width": ASSET_PREDICTION_LINE_WIDTH,
    "line-dasharray": ASSET_PREDICTION_DASHARRAY,
  },
};

function trackLayerBeforeId(map: Map): string | undefined {
  return map.getLayer(MAP_LAYERS.assetsCircles)
    ? MAP_LAYERS.assetsCircles
    : undefined;
}

function ensureTrackLayersBelowAssets(map: Map): void {
  const beforeId = trackLayerBeforeId(map);

  if (!beforeId) {
    return;
  }

  for (const layerId of [
    MAP_LAYERS.assetHistoryLine,
    MAP_LAYERS.assetPredictionLine,
  ]) {
    if (map.getLayer(layerId)) {
      map.moveLayer(layerId, beforeId);
    }
  }
}

function addTrackLayerStack(
  map: Map,
  detail: AssetTrackDetail | null,
  threat: ThreatLevel,
): void {
  const beforeId = trackLayerBeforeId(map);

  map.addSource(MAP_LAYERS.assetHistorySource, historySource(detail));
  map.addSource(MAP_LAYERS.assetPredictionSource, predictionSource(detail, threat));

  if (beforeId) {
    map.addLayer(historyLineLayer, beforeId);
    map.addLayer(predictionLineLayer, beforeId);
    return;
  }

  map.addLayer(historyLineLayer);
  map.addLayer(predictionLineLayer);
}

/** Attach or update history and prediction lines for the selected asset. */
export function syncAssetTrackLayers(
  map: Map,
  detail: AssetTrackDetail | null,
  threat: ThreatLevel = "normal",
): void {
  if (!map.getSource(MAP_LAYERS.assetHistorySource)) {
    addTrackLayerStack(map, detail, threat);
    ensureTrackLayersBelowAssets(map);
    return;
  }

  updateAssetTrackLayerData(map, detail, threat);
}

/** Push latest track detail into existing GeoJSON sources. */
export function updateAssetTrackLayerData(
  map: Map,
  detail: AssetTrackDetail | null,
  threat: ThreatLevel = "normal",
): void {
  const history = map.getSource(MAP_LAYERS.assetHistorySource) as
    | GeoJSONSource
    | undefined;
  const prediction = map.getSource(MAP_LAYERS.assetPredictionSource) as
    | GeoJSONSource
    | undefined;

  history?.setData(detail ? historyCollection(detail) : emptyLineCollection());
  prediction?.setData(
    detail ? predictionCollection(detail, threat) : emptyLineCollection(),
  );
  ensureTrackLayersBelowAssets(map);
}

/** Remove track overlay layers (deselect). */
export function clearAssetTrackLayers(map: Map): void {
  updateAssetTrackLayerData(map, null);
}
