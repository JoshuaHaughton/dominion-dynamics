import type {
  CircleLayerSpecification,
  GeoJSONSource,
  GeoJSONSourceSpecification,
  Map,
  SymbolLayerSpecification,
} from "maplibre-gl";
import type { FeatureCollection, Point } from "geojson";
import type { Asset } from "@dominion-dynamics/shared";
import {
  ASSET_CIRCLE_RADIUS,
  ASSET_HEADING_GAP_PX,
  ASSET_HEADING_ICON_SIZE,
  ASSET_SOURCE_COLORS,
  ASSET_THREAT_COLORS,
  MAP_LAYERS,
} from "../../lib/constants/mapConstants.js";

const ASSET_HEADING_ICON_ID = "asset-heading-chevron";
/** High-res canvas; MapLibre downsamples to ASSET_HEADING_ICON_ON_MAP_PX via pixelRatio. */
const ASSET_HEADING_ICON_PIXEL_RATIO = 4;
const ASSET_HEADING_ICON_ON_MAP_PX = 32;

/** Convert live assets into a GeoJSON FeatureCollection for MapLibre. */
export function assetsToFeatureCollection(
  assets: readonly Asset[],
): FeatureCollection<Point> {
  return {
    type: "FeatureCollection",
    features: assets.map((asset) => ({
      type: "Feature",
      id: asset.id,
      geometry: {
        type: "Point",
        coordinates: [asset.lon, asset.lat],
      },
      properties: {
        id: asset.id,
        source: asset.source,
        heading: asset.heading,
        threat: asset.threat,
      },
    })),
  };
}

/**
 * Register the SDF heading chevron on the map.
 * The icon is drawn on an offscreen canvas (not a file or sprite sheet), then
 * registered via map.addImage as an SDF so MapLibre can tint it per feature.
 *
 * Layout: icon-anchor is "bottom", so the bottom-centre of this canvas sits on
 * the asset point (same as the circle centre). wingY is placed so the inner edge
 * of the V sits at circle edge + ASSET_HEADING_GAP_PX.
 */
export async function ensureAssetHeadingIcon(map: Map): Promise<void> {
  if (map.hasImage(ASSET_HEADING_ICON_ID)) {
    map.removeImage(ASSET_HEADING_ICON_ID);
  }

  const width = ASSET_HEADING_ICON_ON_MAP_PX * ASSET_HEADING_ICON_PIXEL_RATIO;
  const height = width;
  const scale = ASSET_HEADING_ICON_PIXEL_RATIO;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");

  if (!context) {
    return;
  }

  // Chevron shape: open V pointing up (MapLibre rotates via icon-rotate).
  // tipY / wingY / wingSpread control angle: atan(wingSpread / (wingY - tipY)).
  const centerX = width / 2;
  const wingInsetFromBottom =
    ((ASSET_CIRCLE_RADIUS + ASSET_HEADING_GAP_PX) * scale) /
    ASSET_HEADING_ICON_SIZE;
  const wingY = height - wingInsetFromBottom;
  const wingSpread = 6.5 * scale;
  const tipY = wingY - 8 * scale;

  // SDF icons are white on canvas; MapLibre tints via icon-color at render time.
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
    { sdf: true, pixelRatio: ASSET_HEADING_ICON_PIXEL_RATIO },
  );
}

/** GeoJSON source spec for live asset points. promoteId keeps feature ids stable on updates. */
const assetsSource = (
  assets: readonly Asset[],
): GeoJSONSourceSpecification => ({
  type: "geojson",
  data: assetsToFeatureCollection(assets),
  promoteId: "id",
});

/** Position dot colored by server-computed threat level. */
const assetsCircleLayer: CircleLayerSpecification = {
  id: MAP_LAYERS.assetsCircles,
  type: "circle",
  source: MAP_LAYERS.assetsSource,
  paint: {
    "circle-radius": ASSET_CIRCLE_RADIUS,
    // match: threat === "critical" ? red : "warning" ? amber : slate (last value is default)
    "circle-color": [
      "match",
      ["get", "threat"],
      "critical",
      ASSET_THREAT_COLORS.critical,
      "warning",
      ASSET_THREAT_COLORS.warning,
      ASSET_THREAT_COLORS.normal,
    ],
    "circle-stroke-width": 1,
    "circle-stroke-color": ASSET_SOURCE_COLORS.stroke,
  },
};

/** Thin heading chevron outside the circle; tip rotates with properties.heading. */
const assetsHeadingLayer: SymbolLayerSpecification = {
  id: MAP_LAYERS.assetsHeading,
  type: "symbol",
  source: MAP_LAYERS.assetsSource,
  layout: {
    "icon-image": ASSET_HEADING_ICON_ID,
    "icon-size": ASSET_HEADING_ICON_SIZE,
    "icon-anchor": "bottom",
    "icon-rotate": ["get", "heading"],
    "icon-rotation-alignment": "map",
    "icon-allow-overlap": true,
    "icon-ignore-placement": true,
  },
  paint: {
    // Same threat palette as the position dot.
    "icon-color": [
      "match",
      ["get", "threat"],
      "critical",
      ASSET_THREAT_COLORS.critical,
      "warning",
      ASSET_THREAT_COLORS.warning,
      ASSET_THREAT_COLORS.normal,
    ],
  },
};

/** Add the shared source plus circle and heading layers. */
function addAssetLayerStack(map: Map, assets: readonly Asset[]): void {
  map.addSource(MAP_LAYERS.assetsSource, assetsSource(assets));
  map.addLayer(assetsCircleLayer);
  map.addLayer(assetsHeadingLayer);
}

/** Attach asset layers on first map load. No-op if the source already exists. */
export async function addAssetLayers(
  map: Map,
  assets: readonly Asset[],
): Promise<void> {
  await ensureAssetHeadingIcon(map);

  if (!map.getSource(MAP_LAYERS.assetsSource)) {
    addAssetLayerStack(map, assets);
    return;
  }

  updateAssetLayerData(map, assets);
}

/** Push the latest asset snapshot into the existing GeoJSON source. */
export function updateAssetLayerData(map: Map, assets: readonly Asset[]): void {
  const source = map.getSource(MAP_LAYERS.assetsSource) as
    | GeoJSONSource
    | undefined;

  if (!source) {
    return;
  }

  source.setData(assetsToFeatureCollection(assets));
}

/** Re-attach asset layers after a basemap style swap clears custom layers. */
export async function syncAssetLayers(
  map: Map,
  assets: readonly Asset[],
): Promise<void> {
  await ensureAssetHeadingIcon(map);

  if (map.getLayer(MAP_LAYERS.assetsCircles)) {
    updateAssetLayerData(map, assets);
    return;
  }

  addAssetLayerStack(map, assets);
}
