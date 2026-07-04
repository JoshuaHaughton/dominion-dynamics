import type { SimBounds } from "@dominion-dynamics/shared";

/** Ottawa-Gatineau demo AOI. Matches backend sim seed region defaults. */
export const DEMO_SEED_REGION: SimBounds = {
  minLat: 45.2,
  maxLat: 45.6,
  minLon: -76.1,
  maxLon: -75.3,
};

export const MAP_STYLE_URL = "https://demotiles.maplibre.org/style.json";

export const MAP_LAYERS = {
  assetsSource: "assets",
  assetsCircles: "assets-circles",
} as const;

/** Pixel padding when fitting the map to the demo region. */
export const MAP_FIT_PADDING = 48;
/** Initial zoom before the first asset snapshot arrives. */
export const INITIAL_MAP_ZOOM = 9;

export const ASSET_SOURCE_COLORS = {
  opensky: "#38bdf8",
  synthetic: "#f97316",
  stroke: "#0f172a",
} as const;
