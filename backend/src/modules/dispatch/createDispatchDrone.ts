import type { Asset } from "@dominion-dynamics/shared";
import { headingToward } from "../../lib/geo/distanceAndHeading.js";
import {
  PATROL_DRONE_ALT_M,
  PATROL_DRONE_SPEED_MPS,
  PATROL_MAX_INTERCEPT_MPS,
} from "../patrol/constants.js";
import { issueDispatchCallsign } from "./dispatchDroneStore.js";
import type {
  DispatchAssignmentDecision,
  DispatchDroneState,
  DispatchMission,
} from "./types.js";

function baseDispatchAsset(
  droneId: string,
  callsign: string,
  lat: number,
  lon: number,
  heading: number,
): Asset {
  return {
    id: droneId,
    lat,
    lon,
    alt: PATROL_DRONE_ALT_M,
    heading,
    speed: PATROL_MAX_INTERCEPT_MPS,
    role: "drone",
    category: 14,
    callsign,
    originCountry: null,
    onGround: false,
    zone: null,
  };
}

/** Airport-born drone placed at the scramble base, enroute to its first target. */
export function createSpawnedDispatchDrone(
  mission: DispatchMission,
  spawnLat: number,
  spawnLon: number,
  targetLat: number,
  targetLon: number,
): DispatchDroneState {
  return {
    phase: "enroute",
    targetId: mission.targetId,
    assignmentSource: mission.assignmentSource,
    homeAirportIdent: mission.homeAirportIdent,
    origin: "dispatch",
    asset: baseDispatchAsset(
      mission.droneId,
      issueDispatchCallsign(),
      spawnLat,
      spawnLon,
      headingToward(spawnLon, spawnLat, targetLon, targetLat),
    ),
  };
}

/** Reuse an existing dispatch drone or divert patrol — point at the new critical target. */
export function createDispatchDroneFromAsset(
  mission: DispatchMission,
  asset: Asset,
  origin: "dispatch" | "patrol",
): DispatchDroneState {
  return {
    phase: "enroute",
    targetId: mission.targetId,
    assignmentSource: mission.assignmentSource,
    homeAirportIdent: mission.homeAirportIdent,
    origin,
    asset: {
      ...asset,
      speed: PATROL_MAX_INTERCEPT_MPS,
      alt: PATROL_DRONE_ALT_M,
    },
  };
}

export function applyDispatchAssignment(
  mission: DispatchMission,
  decision: DispatchAssignmentDecision,
  target: Pick<Asset, "lat" | "lon">,
  existingAsset?: Asset,
): DispatchDroneState {
  if (decision.type === "spawn") {
    return createSpawnedDispatchDrone(
      mission,
      decision.spawnLat,
      decision.spawnLon,
      target.lat,
      target.lon,
    );
  }

  if (!existingAsset) {
    throw new Error(
      `Dispatch assignment for ${mission.droneId} requires an existing asset`,
    );
  }

  const origin = decision.type === "patrol" ? "patrol" : "dispatch";
  const state = createDispatchDroneFromAsset(mission, existingAsset, origin);

  return {
    ...state,
    asset: {
      ...state.asset,
      heading: headingToward(
        existingAsset.lon,
        existingAsset.lat,
        target.lon,
        target.lat,
      ),
    },
  };
}

/** Idle dispatch drone between missions (RTB complete, awaiting despawn or reuse). */
export function createIdleDispatchDroneAtBase(
  droneId: string,
  homeAirportIdent: string,
  callsign: string,
  lat: number,
  lon: number,
): DispatchDroneState {
  return {
    phase: "at_base",
    targetId: null,
    assignmentSource: "spawn",
    homeAirportIdent,
    origin: "dispatch",
    asset: {
      ...baseDispatchAsset(droneId, callsign, lat, lon, 0),
      speed: PATROL_DRONE_SPEED_MPS,
    },
  };
}
