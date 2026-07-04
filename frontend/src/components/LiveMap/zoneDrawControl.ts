import { MaplibreTerradrawControl } from "@watergis/maplibre-gl-terradraw";
import "@watergis/maplibre-gl-terradraw/dist/maplibre-gl-terradraw.css";
import type { ZoneGeoJson } from "@dominion-dynamics/shared";
import type { Position } from "geojson";
import type { Map } from "maplibre-gl";

type DrawFeatureId = string | number;

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

/** Wire Terra Draw polygon mode; on finish hand off to zone persistence. */
export function attachZoneDrawControl(
  map: Map,
  onPolygonComplete: (geojson: ZoneGeoJson) => void,
  onDrawingChange: (isDrawing: boolean) => void,
  onDrawError: (message: string) => void,
): MaplibreTerradrawControl {
  const control = new MaplibreTerradrawControl({
    modes: ["polygon", "select", "delete-selection"],
    open: false,
  });

  map.addControl(control, "top-left");

  const handleFinish = (id: DrawFeatureId): void => {
    const terraDraw = control.getTerraDrawInstance();

    if (!terraDraw) {
      onDrawError("Draw finished but Terra Draw is not available");
      return;
    }

    const feature = terraDraw.getSnapshotFeature(id);

    if (!feature) {
      onDrawError("Draw finished but the polygon feature was not found");
      return;
    }

    if (feature.geometry.type !== "Polygon") {
      onDrawError(
        `Draw finished with unexpected geometry: ${feature.geometry.type}`,
      );
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
    onDrawingChange(false);
    onPolygonComplete(geojson);
  };

  const syncDrawingState = (): void => {
    const terraDraw = control.getTerraDrawInstance();
    onDrawingChange(terraDraw?.getMode() === "polygon");
  };

  const terraDraw = control.getTerraDrawInstance();

  if (!terraDraw) {
    onDrawError("Terra Draw instance missing after control attach");
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
export function detachZoneDrawControl(
  map: Map,
  control: MaplibreTerradrawControl | undefined,
): void {
  if (control) {
    map.removeControl(control);
  }
}
