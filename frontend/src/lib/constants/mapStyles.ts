export type MapStyleTheme = "light" | "dark";

export type MapStyleDefinition = {
  name: string;
  url: string;
  theme: MapStyleTheme;
  provider: string;
};

/** Free basemap styles (no API key). */
export const MAP_STYLES = {
  "openfreemap-dark": {
    name: "OpenFreeMap Dark",
    url: "https://tiles.openfreemap.org/styles/dark",
    theme: "dark",
    provider: "OpenFreeMap",
  },
  "openfreemap-bright": {
    name: "OpenFreeMap Bright",
    url: "https://tiles.openfreemap.org/styles/bright",
    theme: "light",
    provider: "OpenFreeMap",
  },
  "openfreemap-liberty": {
    name: "OpenFreeMap Liberty",
    url: "https://tiles.openfreemap.org/styles/liberty",
    theme: "light",
    provider: "OpenFreeMap",
  },
  "openfreemap-positron": {
    name: "OpenFreeMap Positron",
    url: "https://tiles.openfreemap.org/styles/positron",
    theme: "light",
    provider: "OpenFreeMap",
  },
  "openfreemap-fiord": {
    name: "OpenFreeMap Fiord",
    url: "https://tiles.openfreemap.org/styles/fiord",
    theme: "dark",
    provider: "OpenFreeMap",
  },
  "versatiles-colorful": {
    name: "VersaTiles Colorful",
    url: "https://tiles.versatiles.org/assets/styles/colorful/style.json",
    theme: "light",
    provider: "VersaTiles",
  },
  "versatiles-neutrino": {
    name: "VersaTiles Neutrino",
    url: "https://tiles.versatiles.org/assets/styles/neutrino/style.json",
    theme: "light",
    provider: "VersaTiles",
  },
  "versatiles-eclipse": {
    name: "VersaTiles Eclipse",
    url: "https://tiles.versatiles.org/assets/styles/eclipse/style.json",
    theme: "dark",
    provider: "VersaTiles",
  },
  "versatiles-graybeard": {
    name: "VersaTiles Graybeard",
    url: "https://tiles.versatiles.org/assets/styles/graybeard/style.json",
    theme: "light",
    provider: "VersaTiles",
  },
  "versatiles-shadow": {
    name: "VersaTiles Shadow",
    url: "https://tiles.versatiles.org/assets/styles/shadow/style.json",
    theme: "dark",
    provider: "VersaTiles",
  },
  "versatiles-satellite": {
    name: "VersaTiles Satellite",
    url: "https://tiles.versatiles.org/assets/styles/satellite/style.json",
    theme: "dark",
    provider: "VersaTiles",
  },
  "osm-americana": {
    name: "OSM Americana",
    url: "https://americanamap.org/style.json",
    theme: "light",
    provider: "OSM Americana",
  },
  "maplibre-demotiles": {
    name: "MapLibre Demo",
    url: "https://demotiles.maplibre.org/style.json",
    theme: "light",
    provider: "MapLibre",
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
