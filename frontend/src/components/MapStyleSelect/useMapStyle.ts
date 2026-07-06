import { useEffect, useState } from "react";
import type { MapStyleId } from "../../lib/constants/mapStyles.js";
import {
  MAP_STYLE_STORAGE_KEY,
  resolveInitialMapStyleId,
} from "./mapStylePrefs.js";

/** Persisted basemap choice for the live map. */
export function useMapStyle(): {
  styleId: MapStyleId;
  setStyleId: (styleId: MapStyleId) => void;
} {
  const [styleId, setStyleId] = useState<MapStyleId>(() =>
    resolveInitialMapStyleId(),
  );

  useEffect(() => {
    localStorage.setItem(MAP_STYLE_STORAGE_KEY, styleId);
  }, [styleId]);

  return { styleId, setStyleId };
}
