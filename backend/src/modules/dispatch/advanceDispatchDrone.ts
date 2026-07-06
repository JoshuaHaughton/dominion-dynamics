import type { Asset } from "@dominion-dynamics/shared";
import type { DispatchPhase } from "@dominion-dynamics/shared";
import { findAirportByIdent } from "../airport/registry.js";
import { distanceM } from "../../lib/geo/distanceAndHeading.js";
import { resolveApproachSpeedMps } from "../../lib/motion/approachSpeed.js";
import { isCriticalTrafficAsset } from "../threat/criticalTraffic.js";
import {
  advanceChaseTowardTarget,
  stepDroneTowardPoint,
} from "../patrol/chaseStep.js";
import {
  capSpeedForRemainingDistance,
  isTrailingTarget,
} from "../patrol/shadowChase.js";
import {
  PATROL_APPROACH_DECEL_M,
  PATROL_DRONE_ALT_M,
  PATROL_MAX_INTERCEPT_MPS,
  PATROL_WAYPOINT_ARRIVAL_M,
  SHADOW_LEAD_LAG_THRESHOLD_M,
} from "../patrol/constants.js";
import type {
  AdvanceDispatchDroneResult,
  DispatchDroneState,
} from "./types.js";

export type AdvanceDispatchDroneParams = {
  state: DispatchDroneState;
  liveAssets: readonly Asset[];
  deltaSeconds: number;
};

function findMissionTarget(
  targetId: string | null,
  liveAssets: readonly Asset[],
): Asset | null {
  if (!targetId) {
    return null;
  }

  const target = liveAssets.find((asset) => asset.id === targetId);

  if (!target || !isCriticalTrafficAsset(target)) {
    return null;
  }

  return target;
}

/** Map chase geometry to wire dispatch phases. */
export function resolveDispatchChasePhase(
  drone: Pick<Asset, "lat" | "lon">,
  target: Pick<Asset, "lat" | "lon" | "heading">,
): Extract<DispatchPhase, "enroute" | "intercepting" | "trailing"> {
  if (isTrailingTarget(drone, target)) {
    return "trailing";
  }

  const distanceToTargetM = distanceM(
    drone.lon,
    drone.lat,
    target.lon,
    target.lat,
  );

  if (distanceToTargetM <= SHADOW_LEAD_LAG_THRESHOLD_M) {
    return "intercepting";
  }

  return "enroute";
}

function resolveRtbApproachSpeed(
  distanceToBaseM: number,
  deltaSeconds: number,
): number {
  return resolveApproachSpeedMps({
    distanceM: distanceToBaseM,
    arrivalM: PATROL_WAYPOINT_ARRIVAL_M,
    decelM: PATROL_APPROACH_DECEL_M,
    deltaSeconds,
    maxSpeed: PATROL_MAX_INTERCEPT_MPS,
    arrivalCapSpeed: PATROL_MAX_INTERCEPT_MPS,
    bandFloorSpeed: 0,
    // Just outside the arrival radius, decel alone can leave the drone crawling
    // forever; ensure at least enough speed to close the gap this tick.
    ensureGapClosure: true,
  });
}

function advanceRtbTowardAirport(
  state: DispatchDroneState,
  airportLat: number,
  airportLon: number,
  deltaSeconds: number,
): AdvanceDispatchDroneResult {
  const distanceToBaseM = distanceM(
    state.asset.lon,
    state.asset.lat,
    airportLon,
    airportLat,
  );

  if (distanceToBaseM <= PATROL_WAYPOINT_ARRIVAL_M) {
    return { kind: "despawn" };
  }

  const distanceBeyondArrivalM = Math.max(
    0,
    distanceToBaseM - PATROL_WAYPOINT_ARRIVAL_M,
  );

  if (distanceBeyondArrivalM < 0.01) {
    return { kind: "despawn" };
  }

  const approachSpeed = capSpeedForRemainingDistance(
    resolveRtbApproachSpeed(distanceToBaseM, deltaSeconds),
    distanceBeyondArrivalM,
    deltaSeconds,
    0,
  );
  const rtbAsset = {
    ...state.asset,
    speed: approachSpeed,
    alt: PATROL_DRONE_ALT_M,
  };
  const moved = stepDroneTowardPoint(
    rtbAsset,
    airportLon,
    airportLat,
    deltaSeconds,
  );

  const distanceAfterM = distanceM(
    moved.lon,
    moved.lat,
    airportLon,
    airportLat,
  );

  if (distanceAfterM <= PATROL_WAYPOINT_ARRIVAL_M) {
    return { kind: "despawn" };
  }

  if (moved.speed === 0) {
    return { kind: "despawn" };
  }

  return {
    kind: "continue",
    state: {
      ...state,
      phase: "rtb",
      targetId: null,
      asset: moved,
    },
  };
}

function beginRtb(state: DispatchDroneState): DispatchDroneState {
  return {
    ...state,
    phase: "rtb",
    targetId: null,
  };
}

/**
 * Advance one dispatch drone tick: chase assigned critical traffic, then RTB
 * to airport (dispatch-born) or hand back to patrol rejoin (patrol-born).
 */
export function advanceDispatchDrone({
  state,
  liveAssets,
  deltaSeconds,
}: AdvanceDispatchDroneParams): AdvanceDispatchDroneResult {
  if (state.phase === "rtb") {
    if (state.assignmentSource === "patrol") {
      return { kind: "release_to_patrol", asset: state.asset };
    }

    if (!state.homeAirportIdent) {
      return { kind: "despawn" };
    }

    const airport = findAirportByIdent(state.homeAirportIdent);

    if (!airport) {
      return { kind: "despawn" };
    }

    return advanceRtbTowardAirport(
      state,
      airport.lat,
      airport.lon,
      deltaSeconds,
    );
  }

  const target = findMissionTarget(state.targetId, liveAssets);

  if (!target) {
    const rtbState = beginRtb(state);

    if (rtbState.assignmentSource === "patrol") {
      return { kind: "release_to_patrol", asset: rtbState.asset };
    }

    if (!rtbState.homeAirportIdent) {
      return { kind: "despawn" };
    }

    const airport = findAirportByIdent(rtbState.homeAirportIdent);

    if (!airport) {
      return { kind: "despawn" };
    }

    return advanceRtbTowardAirport(
      rtbState,
      airport.lat,
      airport.lon,
      deltaSeconds,
    );
  }

  const moved = advanceChaseTowardTarget(state.asset, target, deltaSeconds);

  return {
    kind: "continue",
    state: {
      ...state,
      phase: resolveDispatchChasePhase(moved, target),
      asset: moved,
    },
  };
}
