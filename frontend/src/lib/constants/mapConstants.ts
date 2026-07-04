import type { SimBounds } from "@dominion-dynamics/shared";

/** Ottawa-Gatineau demo AOI. Matches backend sim seed region defaults. */
export const DEMO_SEED_REGION: SimBounds = {
  minLat: 45.2,
  maxLat: 45.6,
  minLon: -76.1,
  maxLon: -75.3,
};

export const MAP_LAYERS = {
  assetsSource: "assets",
  assetsCircles: "assets-circles",
  assetsHeading: "assets-heading",
  zonesSource: "zones",
  zonesFill: "zones-fill",
  zonesOutline: "zones-outline",
} as const;

export const ZONE_FILL_COLOR = "#ef4444";
export const ZONE_FILL_OPACITY = 0.18;
export const ZONE_OUTLINE_COLOR = "#ef4444";
export const ZONE_OUTLINE_WIDTH = 2;

export const ASSET_CIRCLE_RADIUS = 6;
export const ASSET_HEADING_ICON_SIZE = 0.55;
/** Screen pixels between the circle edge and the chevron wing base. */
export const ASSET_HEADING_GAP_PX = 2;

/** Pixel padding when fitting the map to the demo region. */
export const MAP_FIT_PADDING = 48;
/** Initial zoom before the first asset snapshot arrives. */
export const INITIAL_MAP_ZOOM = 9;

export const ASSET_SOURCE_COLORS = {
  opensky: "#38bdf8",
  synthetic: "#f97316",
  stroke: "#f8fafc",
} as const;
