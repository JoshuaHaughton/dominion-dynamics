import type { StyleSpecification } from "maplibre-gl";
import { CUSTOM_MAP_PREFIX } from "../../../lib/constants/mapConstants.js";

function isCustomMapId(id: string): boolean {
  return id.startsWith(CUSTOM_MAP_PREFIX);
}

/** Preserve custom sources and layers when swapping the basemap style. */
export function transformCustomMapStyle(
  previousStyle: StyleSpecification | undefined,
  nextStyle: StyleSpecification,
): StyleSpecification {
  if (!previousStyle) {
    return nextStyle;
  }

  const customSources: StyleSpecification["sources"] = {};

  for (const [id, source] of Object.entries(previousStyle.sources ?? {})) {
    if (isCustomMapId(id)) {
      customSources[id] = source;
    }
  }

  const customLayers = (previousStyle.layers ?? []).filter(
    (layer) => "id" in layer && isCustomMapId(layer.id),
  );

  return {
    ...nextStyle,
    sources: {
      ...nextStyle.sources,
      ...customSources,
    },
    layers: [...(nextStyle.layers ?? []), ...customLayers],
  };
}
