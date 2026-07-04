import type { MapStyleId } from "./mapStyles.js";
import {
  DEFAULT_MAP_STYLE_ID,
  MAP_STYLES,
  isMapStyleId,
} from "./mapStyles.js";

export const MAP_STYLE_STORAGE_KEY = "dominion-map-style";

const DEFAULT_LIGHT_MAP_STYLE_ID: MapStyleId = "openfreemap-bright";

/** First launch: stored preference, else system light/dark default. */
export function resolveInitialMapStyleId(): MapStyleId {
  const stored = localStorage.getItem(MAP_STYLE_STORAGE_KEY);

  if (stored && isMapStyleId(stored)) {
    return stored;
  }

  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

  return prefersDark ? DEFAULT_MAP_STYLE_ID : DEFAULT_LIGHT_MAP_STYLE_ID;
}

export function listMapStyleOptions(): Array<{
  id: MapStyleId;
  label: string;
}> {
  return Object.entries(MAP_STYLES).map(([id, style]) => ({
    id: id as MapStyleId,
    label: style.name,
  }));
}
