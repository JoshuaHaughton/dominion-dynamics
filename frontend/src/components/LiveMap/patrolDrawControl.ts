import type { MaplibreTerradrawControl } from "@watergis/maplibre-gl-terradraw";

/** Activate Terra Draw in polyline mode so the operator can sketch a patrol route. */
export function startPatrolDraw(
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
  control.getTerraDrawInstance()?.setMode("polyline");
}
