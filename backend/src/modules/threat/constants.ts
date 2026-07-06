import type { AssetZoneState } from "@dominion-dynamics/shared";

/** Warning threshold from spec: TTE at or below this value triggers warning symbology. */
export const WARNING_WINDOW_SECONDS = 300;

/** Placeholder zone state before threat enrichment runs on a traffic asset. */
export const DEFAULT_TRAFFIC_ZONE: AssetZoneState = {
  threat: "normal",
  zoneTteSeconds: null,
  nearestBoundaryM: null,
};
