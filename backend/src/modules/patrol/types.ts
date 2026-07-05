import type { Asset, PatrolMode, PathGeoJson } from "@dominion-dynamics/shared";

export type PatrolDroneState = {
  mode: PatrolMode;
  /** Index of the waypoint the drone is currently flying toward. */
  segmentIndex: number;
  shadowTargetId: string | null;
  pathId: number | null;
  asset: Asset;
};

export type AdvancePatrolDroneParams = {
  state: PatrolDroneState;
  path: PathGeoJson;
  liveAssets: readonly Asset[];
  deltaSeconds: number;
};
