import type { SimBounds } from "@dominion-dynamics/shared";

/** Ottawa-Gatineau demo AOI. Matches backend sim seed region defaults. */
export const DEMO_SEED_REGION: SimBounds = {
  minLat: 45.2,
  maxLat: 45.6,
  minLon: -76.1,
  maxLon: -75.3,
};

/**
 * Tighter map focus for the Ottawa dispatch demo (CYOW + CYRO with padding).
 * Used for initial center/fitBounds only; traffic still seeds across {@link DEMO_SEED_REGION}.
 */
export const DEMO_MAP_FOCUS_REGION: SimBounds = {
  minLat: 45.28,
  maxLat: 45.46,
  minLon: -75.78,
  maxLon: -75.62,
};

/** Prefix for custom MapLibre sources and layers preserved across basemap swaps. */
export const CUSTOM_MAP_PREFIX = "dd-";

export const MAP_LAYERS = {
  assetsSource: `${CUSTOM_MAP_PREFIX}assets`,
  assetsCircles: `${CUSTOM_MAP_PREFIX}assets-circles`,
  assetsHeading: `${CUSTOM_MAP_PREFIX}assets-heading`,
  zonesSource: `${CUSTOM_MAP_PREFIX}zones`,
  zonesFill: `${CUSTOM_MAP_PREFIX}zones-fill`,
  zonesOutline: `${CUSTOM_MAP_PREFIX}zones-outline`,
  assetHistorySource: `${CUSTOM_MAP_PREFIX}asset-history`,
  assetHistoryLine: `${CUSTOM_MAP_PREFIX}asset-history-line`,
  assetPredictionSource: `${CUSTOM_MAP_PREFIX}asset-prediction`,
  assetPredictionLine: `${CUSTOM_MAP_PREFIX}asset-prediction-line`,
  patrolPathSource: `${CUSTOM_MAP_PREFIX}patrol-path`,
  patrolPathLine: `${CUSTOM_MAP_PREFIX}patrol-path-line`,
} as const;

export const ZONE_FILL_COLOR = "#ef4444";
export const ZONE_FILL_OPACITY = 0.18;
export const ZONE_OUTLINE_COLOR = "#ef4444";
export const ZONE_OUTLINE_WIDTH = 2;

export const PATROL_PATH_LINE_COLOR = "#38bdf8";
export const PATROL_PATH_LINE_WIDTH = 3;

export const ASSET_CIRCLE_RADIUS = 6;
/** Slightly larger dot so the friendly patrol drone reads apart from traffic. */
export const PATROL_ASSET_CIRCLE_RADIUS = 7;

/** Map and panel accent colors for patrol drone tasking mode. */
export const ASSET_PATROL_MODE_COLORS = {
  patrol: PATROL_PATH_LINE_COLOR,
  shadow: "#f59e0b",
  rejoin: "#818cf8",
} as const;
export const ASSET_HEADING_ICON_SIZE = 0.55;
/** Screen pixels between the circle edge and the chevron wing base. */
export const ASSET_HEADING_GAP_PX = 2;

/** Pixel padding when fitting the map to the demo region. */
export const MAP_FIT_PADDING = 48;
/** Ease/fit duration for programmatic camera moves (select, follow, header focus). */
export const MAP_CAMERA_ANIMATION_MS = 400;
/** Initial zoom before the first asset snapshot arrives. */
export const INITIAL_MAP_ZOOM = 9;

export const ASSET_SOURCE_COLORS = {
  opensky: "#38bdf8",
  synthetic: "#f97316",
  stroke: "#f8fafc",
} as const;

/** Threat level colors for traffic assets on the map. */
export const ASSET_THREAT_COLORS = {
  normal: "#64748b",
  warning: "#f59e0b",
  critical: "#ef4444",
} as const;

export const ASSET_HISTORY_LINE_COLOR = "#94a3b8";
export const ASSET_HISTORY_LINE_WIDTH = 3;
export const ASSET_HISTORY_LINE_OPACITY = 0.55;

export const ASSET_PREDICTION_LINE_COLOR = "#e2e8f0";
export const ASSET_PREDICTION_LINE_WIDTH = 2;
export const ASSET_PREDICTION_DASHARRAY: [number, number] = [2, 2];
