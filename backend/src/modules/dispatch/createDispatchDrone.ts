import { PATROL_ASSET_ID } from "@dominion-dynamics/shared";
import type { Asset } from "@dominion-dynamics/shared";
import { headingToward } from "../../lib/geo/distanceAndHeading.js";
import { buildDroneAsset } from "../drones/buildDroneAsset.js";
import {
  PATROL_DRONE_ALT_M,
  PATROL_MAX_INTERCEPT_MPS,
} from "../patrol/constants.js";
import { issueDispatchCallsign } from "./dispatchDroneStore.js";
import type {
  DispatchAssignmentDecision,
  DispatchDroneState,
  DispatchMission,
} from "./types.js";

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
    asset: buildDroneAsset({
      id: mission.droneId,
      callsign: issueDispatchCallsign(),
      lat: spawnLat,
      lon: spawnLon,
      heading: headingToward(spawnLon, spawnLat, targetLon, targetLat),
      speed: PATROL_MAX_INTERCEPT_MPS,
    }),
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

/** Materialize an allocator decision into runtime dispatch drone sim state. */
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

  const origin = resolveAssignmentOrigin(mission, existingAsset);
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

/** Wire origin for reuse/patrol decisions — not the same as assignmentSource. */
function resolveAssignmentOrigin(
  mission: DispatchMission,
  existingAsset: Asset,
): "dispatch" | "patrol" {
  if (
    mission.assignmentSource === "patrol" ||
    existingAsset.id === PATROL_ASSET_ID ||
    existingAsset.drone?.origin === "patrol"
  ) {
    return "patrol";
  }

  return "dispatch";
}
