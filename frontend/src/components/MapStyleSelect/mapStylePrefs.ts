import type { MapStyleId } from "../../lib/constants/mapStyles.js";
import {
  DEFAULT_MAP_STYLE_ID,
  MAP_STYLES,
  isMapStyleId,
} from "../../lib/constants/mapStyles.js";

export const MAP_STYLE_STORAGE_KEY = "dominion-map-style";

const DEFAULT_LIGHT_MAP_STYLE_ID: MapStyleId = "openfreemap-positron";

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
  return (Object.keys(MAP_STYLES) as MapStyleId[]).map((id) => ({
    id,
    label: MAP_STYLES[id].name,
  }));
}
