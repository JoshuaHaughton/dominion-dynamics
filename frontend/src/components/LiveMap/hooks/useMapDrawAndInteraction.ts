import type maplibregl from "maplibre-gl";
import type { Map as MapLibreMap } from "maplibre-gl";
import type { MaplibreTerradrawControl } from "@watergis/maplibre-gl-terradraw";
import { useCallback, useEffect, useRef, useState } from "react";
import type { MapContext } from "../mapContext.js";
import {
  attachDrawControl,
  detachDrawControl,
  startDraw,
} from "../map/drawControl.js";
import { ASSET_BODY_LAYER_IDS } from "../map/liveMapUtils.js";

type UseMapDrawAndInteractionResult = {
  isDrawingZone: boolean;
  isDrawingPatrol: boolean;
  beginZoneDraw: () => void;
  beginPatrolDraw: () => void;
  /** (Re)attach the TerraDraw control; safe to call after style swaps. */
  setupDrawControl: (map: MapLibreMap) => void;
  /** Bind asset click/hover + camera-follow-cancel handlers (idempotent). */
  attachInteractionHandlers: (map: MapLibreMap) => void;
  /** Detach the draw control and reset local draw state (map teardown). */
  teardownDraw: (map: MapLibreMap) => void;
};

/** Draw-mode state, TerraDraw wiring, and map pointer interaction handlers. */
export function useMapDrawAndInteraction(
  context: MapContext,
): UseMapDrawAndInteractionResult {
  /** Latest props/callbacks for map listeners without re-binding handlers each render. */
  const mapContextRef = useRef(context);

  useEffect(() => {
    mapContextRef.current = context;
  });

  const drawControlRef = useRef<MaplibreTerradrawControl | undefined>(
    undefined,
  );
  const clickHandlersAttachedRef = useRef(false);
  const [isDrawingZone, setIsDrawingZone] = useState(false);
  const [isDrawingPatrol, setIsDrawingPatrol] = useState(false);
  // Map event handlers need the live draw mode without re-binding; this hook
  // owns draw state, so it mirrors it into a local ref (not the map context).
  const drawStateRef = useRef({ zone: false, patrol: false });

  const markZoneDrawing = useCallback((drawing: boolean) => {
    drawStateRef.current.zone = drawing;
    setIsDrawingZone(drawing);
  }, []);

  const markPatrolDrawing = useCallback((drawing: boolean) => {
    drawStateRef.current.patrol = drawing;
    setIsDrawingPatrol(drawing);
  }, []);

  const isDrawing = useCallback(
    () => drawStateRef.current.zone || drawStateRef.current.patrol,
    [],
  );

  const resetDrawMode = useCallback(() => {
    drawControlRef.current?.resetActiveMode();
    markZoneDrawing(false);
    markPatrolDrawing(false);
  }, [markPatrolDrawing, markZoneDrawing]);

  const beginZoneDraw = useCallback(() => {
    if (isDrawingZone) {
      resetDrawMode();
      return;
    }

    if (isDrawingPatrol) {
      resetDrawMode();
    }

    startDraw(drawControlRef.current, "polygon", false);
  }, [isDrawingPatrol, isDrawingZone, resetDrawMode]);

  const beginPatrolDraw = useCallback(() => {
    if (isDrawingPatrol) {
      resetDrawMode();
      return;
    }

    if (isDrawingZone) {
      resetDrawMode();
    }

    startDraw(drawControlRef.current, "polyline", false);
  }, [isDrawingPatrol, isDrawingZone, resetDrawMode]);

  const setupDrawControl = useCallback(
    (map: MapLibreMap) => {
      detachDrawControl(map, drawControlRef.current);
      drawControlRef.current = attachDrawControl(map, {
        onZoneComplete: (geojson) => {
          mapContextRef.current.onZoneDrawn(geojson);
        },
        onPatrolPathComplete: (geojson) => {
          mapContextRef.current.onPatrolPathDrawn(geojson);
        },
        onZoneDrawingChange: markZoneDrawing,
        onPatrolDrawingChange: markPatrolDrawing,
        onDrawError: (message) => {
          const context = mapContextRef.current;

          if (drawStateRef.current.patrol) {
            context.onPatrolDrawError(message);
            return;
          }

          context.onZoneDrawError(message);
        },
      });
    },
    [markPatrolDrawing, markZoneDrawing],
  );

  const attachInteractionHandlers = useCallback(
    (map: MapLibreMap) => {
      if (clickHandlersAttachedRef.current) return;

      clickHandlersAttachedRef.current = true;

      for (const layerId of ASSET_BODY_LAYER_IDS) {
        map.on("click", layerId, (event) => {
          if (isDrawing()) return;

          const feature = event.features?.[0];
          const assetId = feature?.properties?.id;

          if (typeof assetId === "string" && assetId.length > 0) {
            mapContextRef.current.onAssetSelect(assetId);
          }
        });

        map.on("mouseenter", layerId, () => {
          if (!isDrawing()) {
            map.getCanvas().style.cursor = "pointer";
          }
        });

        map.on("mouseleave", layerId, () => {
          map.getCanvas().style.cursor = "";
        });
      }

      map.on("click", (event) => {
        if (isDrawing()) return;

        const hits = map.queryRenderedFeatures(event.point, {
          layers: [...ASSET_BODY_LAYER_IDS],
        });

        if (hits.length === 0) {
          mapContextRef.current.onAssetSelect(null);
        }
      });

      /** Panning looks elsewhere; zoom keeps the operator close to the followed asset. */
      const stopFollowingOnPan = (event: maplibregl.MapLibreEvent) => {
        if (!event.originalEvent) return;

        mapContextRef.current.onFollowingChange(false);
      };

      map.on("dragstart", stopFollowingOnPan);
    },
    [isDrawing],
  );

  const teardownDraw = useCallback(
    (map: MapLibreMap) => {
      detachDrawControl(map, drawControlRef.current);
      drawControlRef.current = undefined;
      clickHandlersAttachedRef.current = false;
      markZoneDrawing(false);
      markPatrolDrawing(false);
    },
    [markPatrolDrawing, markZoneDrawing],
  );

  return {
    isDrawingZone,
    isDrawingPatrol,
    beginZoneDraw,
    beginPatrolDraw,
    setupDrawControl,
    attachInteractionHandlers,
    teardownDraw,
  };
}
