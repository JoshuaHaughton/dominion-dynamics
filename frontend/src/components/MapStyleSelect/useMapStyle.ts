import { useEffect, useState } from "react";
import type { MapStyleId } from "../constants/mapStyles.js";
import {
  MAP_STYLE_STORAGE_KEY,
  resolveInitialMapStyleId,
} from "../constants/mapStyleUtils.js";

/** Persisted basemap choice for the live map. */
export function useMapStyle() {
  const [styleId, setStyleId] = useState<MapStyleId>(() =>
    resolveInitialMapStyleId(),
  );

  useEffect(() => {
    localStorage.setItem(MAP_STYLE_STORAGE_KEY, styleId);
  }, [styleId]);

  return { styleId, setStyleId };
}
