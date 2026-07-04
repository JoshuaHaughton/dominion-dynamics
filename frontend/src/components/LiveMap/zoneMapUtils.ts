import type {
  FillLayerSpecification,
  GeoJSONSource,
  GeoJSONSourceSpecification,
  LineLayerSpecification,
  Map,
} from "maplibre-gl";
import type { FeatureCollection, Polygon } from "geojson";
import {
  MAP_LAYERS,
  ZONE_FILL_COLOR,
  ZONE_FILL_OPACITY,
  ZONE_OUTLINE_COLOR,
  ZONE_OUTLINE_WIDTH,
} from "../../lib/constants/mapConstants.js";
import { isPendingZone, type ZoneView } from "../../lib/hooks/useZones.js";

function zoneFeatureId(zone: ZoneView): string | number {
  return isPendingZone(zone) ? zone.clientId : zone.id;
}

/** Convert server + optimistic zones into a GeoJSON FeatureCollection for MapLibre. */
export function zonesToFeatureCollection(
  zones: readonly ZoneView[],
): FeatureCollection<Polygon> {
  return {
    type: "FeatureCollection",
    features: zones.map((zone) => ({
      type: "Feature",
      id: zoneFeatureId(zone),
      geometry: zone.geojson.geometry,
      properties: {
        id: zoneFeatureId(zone),
        name: zone.name,
        pending: isPendingZone(zone),
      },
    })),
  };
}

const zonesSource = (
  zones: readonly ZoneView[],
): GeoJSONSourceSpecification => ({
  type: "geojson",
  data: zonesToFeatureCollection(zones),
  promoteId: "id",
});

const zonesFillLayer: FillLayerSpecification = {
  id: MAP_LAYERS.zonesFill,
  type: "fill",
  source: MAP_LAYERS.zonesSource,
  paint: {
    "fill-color": ZONE_FILL_COLOR,
    "fill-opacity": ZONE_FILL_OPACITY,
  },
};

const zonesOutlineLayer: LineLayerSpecification = {
  id: MAP_LAYERS.zonesOutline,
  type: "line",
  source: MAP_LAYERS.zonesSource,
  paint: {
    "line-color": ZONE_OUTLINE_COLOR,
    "line-width": ZONE_OUTLINE_WIDTH,
  },
};

function addZoneLayerStack(map: Map, zones: readonly ZoneView[]): void {
  map.addSource(MAP_LAYERS.zonesSource, zonesSource(zones));
  map.addLayer(zonesFillLayer);
  map.addLayer(zonesOutlineLayer);
}

/** Attach zone layers below assets. No-op if the source already exists. */
export function addZoneLayers(map: Map, zones: readonly ZoneView[]): void {
  if (map.getSource(MAP_LAYERS.zonesSource)) {
    updateZoneLayerData(map, zones);
    return;
  }

  addZoneLayerStack(map, zones);
}

/** Push the latest zone list into the existing GeoJSON source. */
export function updateZoneLayerData(
  map: Map,
  zones: readonly ZoneView[],
): void {
  const source = map.getSource(MAP_LAYERS.zonesSource) as
    | GeoJSONSource
    | undefined;

  if (!source) {
    return;
  }

  source.setData(zonesToFeatureCollection(zones));
}

/** Re-attach zone layers after a basemap style swap clears custom layers. */
export function syncZoneLayers(map: Map, zones: readonly ZoneView[]): void {
  if (map.getLayer(MAP_LAYERS.zonesFill)) {
    updateZoneLayerData(map, zones);
    return;
  }

  addZoneLayerStack(map, zones);
}
