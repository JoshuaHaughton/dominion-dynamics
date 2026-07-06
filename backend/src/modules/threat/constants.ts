import type { AssetZoneState } from "@dominion-dynamics/shared";

/** Placeholder zone state before threat enrichment runs on a traffic asset. */
export const DEFAULT_TRAFFIC_ZONE: AssetZoneState = {
  threat: "normal",
  zoneTteSeconds: null,
  nearestBoundaryM: null,
};
