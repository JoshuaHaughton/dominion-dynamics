export type MapStyleTheme = "light" | "dark";

export type MapStyleDefinition = {
  name: string;
  url: string;
  theme: MapStyleTheme;
  provider: string;
};

/** Free basemap styles (no API key). Curated: dark ops default, light, satellite. */
export const MAP_STYLES = {
  "openfreemap-dark": {
    name: "OpenFreeMap Dark",
    url: "https://tiles.openfreemap.org/styles/dark",
    theme: "dark",
    provider: "OpenFreeMap",
  },
  "openfreemap-positron": {
    name: "OpenFreeMap Positron",
    url: "https://tiles.openfreemap.org/styles/positron",
    theme: "light",
    provider: "OpenFreeMap",
  },
  "versatiles-satellite": {
    name: "VersaTiles Satellite",
    url: "https://tiles.versatiles.org/assets/styles/satellite/style.json",
    theme: "dark",
    provider: "VersaTiles",
  },
} as const satisfies Record<string, MapStyleDefinition>;

export type MapStyleId = keyof typeof MAP_STYLES;

/** Default basemap for the live map */
export const DEFAULT_MAP_STYLE_ID: MapStyleId = "openfreemap-dark";

export function getMapStyleUrl(
  styleId: MapStyleId = DEFAULT_MAP_STYLE_ID,
): string {
  return MAP_STYLES[styleId].url;
}

export function isMapStyleId(value: string): value is MapStyleId {
  return value in MAP_STYLES;
}
