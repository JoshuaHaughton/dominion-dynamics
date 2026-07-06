import {
  getDefaultModeOptions,
  MaplibreTerradrawControl,
} from "@watergis/maplibre-gl-terradraw";
import "@watergis/maplibre-gl-terradraw/dist/maplibre-gl-terradraw.css";
import { TerraDrawPolygonMode } from "terra-draw";
import type { PathGeoJson, ZoneGeoJson } from "@dominion-dynamics/shared";
import type { Position } from "geojson";
import type { Map } from "maplibre-gl";

type DrawFeatureId = string | number;

type DrawControlCallbacks = {
  onZoneComplete: (geojson: ZoneGeoJson) => void;
  onPatrolPathComplete: (geojson: PathGeoJson) => void;
  onZoneDrawingChange: (isDrawing: boolean) => void;
  onPatrolDrawingChange: (isDrawing: boolean) => void;
  onDrawError: (message: string) => void;
};

function closePolygonCoordinates(coordinates: Position[][]): Position[][] {
  const ring = coordinates[0];

  if (!ring || ring.length < 3) {
    return coordinates;
  }

  const first = ring[0];
  const last = ring[ring.length - 1];

  if (first[0] === last[0] && first[1] === last[1]) {
    return coordinates;
  }

  return [[...ring, first]];
}

/** Closed polyline mode finishes as a polygon ring; persist patrol routes as LineString. */
function polylinePolygonToPathGeoJson(
  coordinates: Position[][],
): PathGeoJson | null {
  const ring = coordinates[0];

  if (!ring || ring.length < 2) {
    return null;
  }

  return {
    type: "Feature",
    properties: {},
    geometry: {
      type: "LineString",
      coordinates: ring,
    },
  };
}

/** Wire Terra Draw polygon and polyline modes; on finish hand off to persistence. */
export function attachDrawControl(
  map: Map,
  callbacks: DrawControlCallbacks,
): MaplibreTerradrawControl {
  const defaultModeOptions = getDefaultModeOptions();

  const control = new MaplibreTerradrawControl({
    modes: ["polygon", "polyline", "select", "delete-selection"],
    open: false,
    modeOptions: {
      ...defaultModeOptions,
      polygon: new TerraDrawPolygonMode({
        editable: true,
        snapping: { toCoordinate: true },
      }),
    },
  });

  map.addControl(control, "top-left");

  const handleFinish = (id: DrawFeatureId): void => {
    const terraDraw = control.getTerraDrawInstance();

    if (!terraDraw) {
      callbacks.onDrawError("Draw finished but Terra Draw is not available");
      return;
    }

    const feature = terraDraw.getSnapshotFeature(id);

    if (!feature) {
      callbacks.onDrawError("Draw finished but the feature was not found");
      return;
    }

    const drawMode = feature.properties?.mode;

    if (feature.geometry.type === "Polygon") {
      if (drawMode === "polyline") {
        const geojson = polylinePolygonToPathGeoJson(
          feature.geometry.coordinates,
        );

        if (!geojson) {
          callbacks.onDrawError("Closed patrol path needs at least two waypoints");
          return;
        }

        terraDraw.removeFeatures([id]);
        control.resetActiveMode();
        callbacks.onZoneDrawingChange(false);
        callbacks.onPatrolDrawingChange(false);
        callbacks.onPatrolPathComplete(geojson);
        return;
      }

      const geojson: ZoneGeoJson = {
        type: "Feature",
        properties: {},
        geometry: {
          type: "Polygon",
          coordinates: closePolygonCoordinates(feature.geometry.coordinates),
        },
      };

      terraDraw.removeFeatures([id]);
      control.resetActiveMode();
      callbacks.onZoneDrawingChange(false);
      callbacks.onPatrolDrawingChange(false);
      callbacks.onZoneComplete(geojson);
      return;
    }

    if (feature.geometry.type === "LineString" && drawMode === "polyline") {
      const geojson: PathGeoJson = {
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
          coordinates: feature.geometry.coordinates,
        },
      };

      terraDraw.removeFeatures([id]);
      control.resetActiveMode();
      callbacks.onZoneDrawingChange(false);
      callbacks.onPatrolDrawingChange(false);
      callbacks.onPatrolPathComplete(geojson);
      return;
    }

    callbacks.onDrawError(
      `Draw finished with unexpected geometry: ${feature.geometry.type}`,
    );
  };

  const syncDrawingState = (): void => {
    const terraDraw = control.getTerraDrawInstance();
    const mode = terraDraw?.getMode();

    callbacks.onZoneDrawingChange(mode === "polygon");
    callbacks.onPatrolDrawingChange(mode === "polyline");
  };

  const terraDraw = control.getTerraDrawInstance();

  if (!terraDraw) {
    callbacks.onDrawError("Terra Draw instance missing after control attach");
  } else {
    terraDraw.on("finish", handleFinish);
  }

  control.on("mode-changed", syncDrawingState);

  return control;
}

/** Activate Terra Draw in polygon mode so the operator can outline a zone. */
export function startZoneDraw(
  control: MaplibreTerradrawControl | undefined,
  isDrawing = false,
): void {
  if (!control) {
    return;
  }

  if (isDrawing) {
    control.resetActiveMode();
    return;
  }

  control.isExpanded = true;
  control.activate();
  control.getTerraDrawInstance()?.setMode("polygon");
}

/** Remove Terra Draw before a basemap style swap or map teardown. */
export function detachDrawControl(
  map: Map,
  control: MaplibreTerradrawControl | undefined,
): void {
  if (control) {
    map.removeControl(control);
  }
}
