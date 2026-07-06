import type {
  CircleLayerSpecification,
  DataDrivenPropertyValueSpecification,
  GeoJSONSourceSpecification,
  Map as MapLibreMap,
  SymbolLayerSpecification,
} from "maplibre-gl";
import type { FeatureCollection, Point } from "geojson";
import type { Asset } from "@dominion-dynamics/shared";
import { setGeoJsonData } from "./geoJsonLayerLifecycle.js";
import {
  ASSET_CIRCLE_RADIUS,
  ASSET_DISPATCH_BODY_COLOR,
  ASSET_HEADING_GAP_PX,
  ASSET_HEADING_ICON_SIZE,
  ASSET_PATROL_MODE_COLORS,
  ASSET_SELECTED_RADIUS_SCALE,
  ASSET_THREAT_COLORS,
  DRONE_HEADING_OFFSET_Y,
  DRONE_MARKER_DIAMETER_PX,
  DRONE_MARKER_ICON_SIZE,
  DRONE_MARKER_SDF_LOGICAL_PX,
  DRONE_MARKER_SDF_PIXEL_RATIO,
  DRONE_RING_COLORS,
  HEADING_ICON_LOGICAL_PX,
  HEADING_ICON_PIXEL_RATIO,
  MAP_LAYERS,
  TRAFFIC_HEADING_OFFSET_Y,
  TRAFFIC_RING_COLOR,
} from "../../../lib/constants/mapConstants.js";
import {
  deriveAssetSymbology,
  mapEmphasisForAsset,
  symbologyBodyKey,
  symbologyMarkerShape,
  symbologyRingKey,
  type MapVisualFilter,
} from "../../../lib/utils/assetSymbology.js";

const ASSET_HEADING_ICON_ID = "asset-heading-chevron";
const ASSET_MARKER_ICON_SQUARE = "asset-marker-square";

const TRAFFIC_ROLE_FILTER: CircleLayerSpecification["filter"] = [
  "==",
  ["get", "role"],
  "traffic",
];
const DRONE_ROLE_FILTER: SymbolLayerSpecification["filter"] = [
  "==",
  ["get", "role"],
  "drone",
];

const DEFAULT_VISUAL_FILTER: MapVisualFilter = {
  entityTab: "missions",
  statusFilter: "all",
  selectedAssetId: null,
};

function drawSquareSdf(
  context: CanvasRenderingContext2D,
  canvasPx: number,
): void {
  const inset = DRONE_MARKER_SDF_PIXEL_RATIO;
  const side = canvasPx - inset * 2;
  const cornerRadius = 3 * DRONE_MARKER_SDF_PIXEL_RATIO;

  context.clearRect(0, 0, canvasPx, canvasPx);
  context.fillStyle = "#ffffff";
  context.beginPath();
  context.roundRect(inset, inset, side, side, cornerRadius);
  context.fill();
}

/** Register a high-res square SDF for drone bodies (heading-style canvas density). */
async function ensureDroneMarkerIcon(map: MapLibreMap): Promise<void> {
  if (map.hasImage(ASSET_MARKER_ICON_SQUARE)) {
    map.removeImage(ASSET_MARKER_ICON_SQUARE);
  }

  const canvasPx = DRONE_MARKER_SDF_LOGICAL_PX * DRONE_MARKER_SDF_PIXEL_RATIO;
  const canvas = document.createElement("canvas");
  canvas.width = canvasPx;
  canvas.height = canvasPx;

  const context = canvas.getContext("2d");
  if (!context) return;

  drawSquareSdf(context, canvasPx);

  map.addImage(
    ASSET_MARKER_ICON_SQUARE,
    context.getImageData(0, 0, canvasPx, canvasPx),
    { sdf: true, pixelRatio: DRONE_MARKER_SDF_PIXEL_RATIO },
  );
}

/**
 * Register the SDF heading chevron on the map.
 * The icon is drawn on an offscreen canvas, then registered via map.addImage as an
 * SDF so MapLibre can tint it per feature.
 */
async function ensureAssetHeadingIcon(map: MapLibreMap): Promise<void> {
  if (map.hasImage(ASSET_HEADING_ICON_ID)) {
    map.removeImage(ASSET_HEADING_ICON_ID);
  }

  const width = HEADING_ICON_LOGICAL_PX * HEADING_ICON_PIXEL_RATIO;
  const height = width;
  const scale = HEADING_ICON_PIXEL_RATIO;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) return;

  const centerX = width / 2;
  const wingInsetFromBottom =
    ((ASSET_CIRCLE_RADIUS + ASSET_HEADING_GAP_PX) * scale) /
    ASSET_HEADING_ICON_SIZE;
  const wingY = height - wingInsetFromBottom;
  const wingSpread = 6.5 * scale;
  const tipY = wingY - 8 * scale;

  context.clearRect(0, 0, width, height);
  context.strokeStyle = "#ffffff";
  context.lineWidth = 3.5 * scale;
  context.lineCap = "round";
  context.lineJoin = "round";
  context.beginPath();
  context.moveTo(centerX - wingSpread, wingY);
  context.lineTo(centerX, tipY);
  context.lineTo(centerX + wingSpread, wingY);
  context.stroke();

  map.addImage(
    ASSET_HEADING_ICON_ID,
    context.getImageData(0, 0, width, height),
    { sdf: true, pixelRatio: HEADING_ICON_PIXEL_RATIO },
  );
}

async function ensureAssetIcons(map: MapLibreMap): Promise<void> {
  await ensureDroneMarkerIcon(map);
  await ensureAssetHeadingIcon(map);
}

/** Convert live assets into a GeoJSON FeatureCollection for MapLibre. */
export function assetsToFeatureCollection(
  assets: readonly Asset[],
  visualFilter: MapVisualFilter = DEFAULT_VISUAL_FILTER,
): FeatureCollection<Point> {
  const assetsById = new Map(assets.map((asset) => [asset.id, asset]));

  return {
    type: "FeatureCollection",
    features: assets.map((asset) => {
      const symbology = deriveAssetSymbology(asset);
      const emphasis = mapEmphasisForAsset(asset, visualFilter);

      return {
        type: "Feature",
        id: asset.id,
        geometry: {
          type: "Point",
          coordinates: [asset.lon, asset.lat],
        },
        properties: {
          id: asset.id,
          role: asset.role,
          heading: asset.heading,
          markerShape: symbologyMarkerShape(symbology),
          symbologyBodyKey: symbologyBodyKey(symbology),
          symbologyRingKey: symbologyRingKey(asset, assetsById),
          isPatrolOrigin: asset.drone?.origin === "patrol",
          isSelected: visualFilter.selectedAssetId === asset.id,
          mapOpacity: emphasis.opacity,
          mapRadiusScale: emphasis.radiusScale,
          mapStrokeWidth: emphasis.strokeWidth,
        },
      };
    }),
  };
}

const assetsSource = (
  assets: readonly Asset[],
  visualFilter: MapVisualFilter,
): GeoJSONSourceSpecification => ({
  type: "geojson",
  data: assetsToFeatureCollection(assets, visualFilter),
  promoteId: "id",
});

const symbologyBodyColor: DataDrivenPropertyValueSpecification<string> = [
  "match",
  ["get", "symbologyBodyKey"],
  "traffic:critical",
  ASSET_THREAT_COLORS.critical,
  "traffic:warning",
  ASSET_THREAT_COLORS.warning,
  "traffic:normal",
  ASSET_THREAT_COLORS.normal,
  "patrol:patrol",
  ASSET_PATROL_MODE_COLORS.patrol,
  "patrol:shadow",
  ASSET_PATROL_MODE_COLORS.patrol,
  "patrol:rejoin",
  ASSET_PATROL_MODE_COLORS.patrol,
  "dispatch:enroute",
  ASSET_DISPATCH_BODY_COLOR,
  "dispatch:intercepting",
  ASSET_DISPATCH_BODY_COLOR,
  "dispatch:trailing",
  ASSET_DISPATCH_BODY_COLOR,
  "dispatch:rtb",
  ASSET_DISPATCH_BODY_COLOR,
  "dispatch:at_base",
  ASSET_DISPATCH_BODY_COLOR,
  ASSET_THREAT_COLORS.normal,
];

/** Patrol-slot drones stay cyan even while running a dispatch mission. */
const normalFillColor: DataDrivenPropertyValueSpecification<string> = [
  "case",
  ["get", "isPatrolOrigin"],
  ASSET_PATROL_MODE_COLORS.patrol,
  symbologyBodyColor,
];

const markerBodyColor: DataDrivenPropertyValueSpecification<string> = [
  "case",
  ["get", "isSelected"],
  "#ffffff",
  normalFillColor,
];

const symbologyRingColor: DataDrivenPropertyValueSpecification<string> = [
  "match",
  ["get", "symbologyRingKey"],
  "traffic-stroke",
  TRAFFIC_RING_COLOR,
  "drone-ring:critical-target",
  DRONE_RING_COLORS.criticalTarget,
  "drone-ring:returning",
  DRONE_RING_COLORS.returning,
  "drone-ring:default",
  DRONE_RING_COLORS.default,
  DRONE_RING_COLORS.default,
];

const markerRingColor: DataDrivenPropertyValueSpecification<string> = [
  "case",
  ["get", "isSelected"],
  normalFillColor,
  symbologyRingColor,
];

const trafficCircleRadius: DataDrivenPropertyValueSpecification<number> = [
  "*",
  ASSET_CIRCLE_RADIUS,
  ["get", "mapRadiusScale"],
];

const assetsCircleLayer: CircleLayerSpecification = {
  id: MAP_LAYERS.assetsCircles,
  type: "circle",
  source: MAP_LAYERS.assetsSource,
  filter: TRAFFIC_ROLE_FILTER,
  paint: {
    "circle-radius": trafficCircleRadius,
    "circle-color": markerBodyColor,
    "circle-opacity": ["get", "mapOpacity"],
    "circle-stroke-color": markerRingColor,
    "circle-stroke-width": ["get", "mapStrokeWidth"],
  },
};

const droneIconSize: DataDrivenPropertyValueSpecification<number> = [
  "*",
  DRONE_MARKER_ICON_SIZE,
  ["get", "mapRadiusScale"],
];

/**
 * Ring rendered as a slightly larger square underneath the body. SDF icon halos
 * clip at the sprite edge, so scaling an underlay is the only way to get a
 * stroke that visibly thickens on selection.
 */
const droneRingIconSize: DataDrivenPropertyValueSpecification<number> = [
  "*",
  DRONE_MARKER_ICON_SIZE,
  ["get", "mapRadiusScale"],
  [
    "+",
    1,
    ["/", ["*", 2, ["get", "mapStrokeWidth"]], DRONE_MARKER_DIAMETER_PX],
  ],
];

const assetsDroneMarkerRingLayer: SymbolLayerSpecification = {
  id: MAP_LAYERS.assetsMarkerRings,
  type: "symbol",
  source: MAP_LAYERS.assetsSource,
  filter: DRONE_ROLE_FILTER,
  layout: {
    "icon-image": ASSET_MARKER_ICON_SQUARE,
    "icon-size": droneRingIconSize,
    "icon-allow-overlap": true,
    "icon-ignore-placement": true,
  },
  paint: {
    "icon-color": markerRingColor,
    "icon-opacity": ["get", "mapOpacity"],
  },
};

const assetsDroneMarkerLayer: SymbolLayerSpecification = {
  id: MAP_LAYERS.assetsMarkers,
  type: "symbol",
  source: MAP_LAYERS.assetsSource,
  filter: DRONE_ROLE_FILTER,
  layout: {
    "icon-image": ASSET_MARKER_ICON_SQUARE,
    "icon-size": droneIconSize,
    "icon-allow-overlap": true,
    "icon-ignore-placement": true,
  },
  paint: {
    "icon-color": markerBodyColor,
    "icon-opacity": ["get", "mapOpacity"],
  },
};

/** icon-offset components are multiplied by icon-size, so values stay in chevron units. */
const headingIconOffset: DataDrivenPropertyValueSpecification<
  [number, number]
> = [
  "case",
  ["==", ["get", "role"], "drone"],
  [
    "case",
    ["get", "isSelected"],
    ["literal", [0, DRONE_HEADING_OFFSET_Y * ASSET_SELECTED_RADIUS_SCALE]],
    ["literal", [0, DRONE_HEADING_OFFSET_Y]],
  ],
  [
    "case",
    ["get", "isSelected"],
    ["literal", [0, TRAFFIC_HEADING_OFFSET_Y * ASSET_SELECTED_RADIUS_SCALE]],
    ["literal", [0, TRAFFIC_HEADING_OFFSET_Y]],
  ],
];

const assetsHeadingLayer: SymbolLayerSpecification = {
  id: MAP_LAYERS.assetsHeading,
  type: "symbol",
  source: MAP_LAYERS.assetsSource,
  layout: {
    "icon-image": ASSET_HEADING_ICON_ID,
    "icon-size": ASSET_HEADING_ICON_SIZE,
    "icon-anchor": "bottom",
    "icon-offset": headingIconOffset,
    "icon-rotate": ["get", "heading"],
    "icon-rotation-alignment": "map",
    "icon-allow-overlap": true,
    "icon-ignore-placement": true,
  },
  paint: {
    "icon-color": normalFillColor,
    "icon-opacity": ["get", "mapOpacity"],
  },
};

function addAssetLayerStack(
  map: MapLibreMap,
  assets: readonly Asset[],
  visualFilter: MapVisualFilter,
): void {
  map.addSource(MAP_LAYERS.assetsSource, assetsSource(assets, visualFilter));
  map.addLayer(assetsCircleLayer);
  map.addLayer(assetsDroneMarkerRingLayer);
  map.addLayer(assetsDroneMarkerLayer);
  map.addLayer(assetsHeadingLayer);
}

function hasAssetBodyLayers(map: MapLibreMap): boolean {
  return (
    map.getLayer(MAP_LAYERS.assetsCircles) !== undefined ||
    map.getLayer(MAP_LAYERS.assetsMarkers) !== undefined
  );
}

/** Push the latest asset snapshot into the existing GeoJSON source. */
export function updateAssetLayerData(
  map: MapLibreMap,
  assets: readonly Asset[],
  visualFilter: MapVisualFilter = DEFAULT_VISUAL_FILTER,
): void {
  setGeoJsonData(
    map,
    MAP_LAYERS.assetsSource,
    assetsToFeatureCollection(assets, visualFilter),
  );
}

/** Re-attach asset layers after a basemap style swap clears custom layers. */
export async function syncAssetLayers(
  map: MapLibreMap,
  assets: readonly Asset[],
  visualFilter: MapVisualFilter = DEFAULT_VISUAL_FILTER,
): Promise<void> {
  await ensureAssetIcons(map);

  if (hasAssetBodyLayers(map)) {
    updateAssetLayerData(map, assets, visualFilter);
    return;
  }

  addAssetLayerStack(map, assets, visualFilter);
}

/** Layer ids used for asset body hit-testing (traffic circles + drone squares). */
export const ASSET_BODY_LAYER_IDS = [
  MAP_LAYERS.assetsCircles,
  MAP_LAYERS.assetsMarkers,
] as const;
