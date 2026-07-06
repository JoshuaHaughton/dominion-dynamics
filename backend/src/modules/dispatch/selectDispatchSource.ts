import { PATROL_ASSET_ID } from "@dominion-dynamics/shared";
import { findNearestAirport } from "../airport/registry.js";
import { distanceM } from "../../lib/geo/distanceAndHeading.js";
import type {
  DispatchAssignmentDecision,
  DispatchDroneCandidate,
} from "./types.js";

type SelectDispatchSourceParams = {
  target: { id: string; lat: number; lon: number };
  drones: readonly DispatchDroneCandidate[];
  reservedDroneIds: ReadonlySet<string>;
  nextDispatchDroneId: string;
};

function distanceToTarget(
  drone: Pick<DispatchDroneCandidate, "lat" | "lon">,
  target: Pick<SelectDispatchSourceParams["target"], "lat" | "lon">,
): number {
  return distanceM(drone.lon, drone.lat, target.lon, target.lat);
}

function isAssignableDrone(
  drone: DispatchDroneCandidate,
  reservedDroneIds: ReadonlySet<string>,
): boolean {
  return (
    drone.availability === "available" &&
    drone.missionTargetId === null &&
    !reservedDroneIds.has(drone.droneId)
  );
}

/** Patrol drone idle on its saved route (`patrol.mode === "patrol"`). */
function isIdleOnPatrolRoute(drone: DispatchDroneCandidate): boolean {
  return drone.origin === "patrol" && drone.patrol?.mode === "patrol";
}

function pickClosestDrone(
  drones: readonly DispatchDroneCandidate[],
  target: SelectDispatchSourceParams["target"],
): DispatchDroneCandidate | null {
  let closest: DispatchDroneCandidate | null = null;
  let closestDistanceM = Number.POSITIVE_INFINITY;

  for (const drone of drones) {
    const distanceMeters = distanceToTarget(drone, target);

    if (distanceMeters < closestDistanceM) {
      closest = drone;
      closestDistanceM = distanceMeters;
    }
  }

  return closest;
}

/** Drones that may receive a new dispatch assignment this tick. */
export function filterAssignableDrones(
  drones: readonly DispatchDroneCandidate[],
  reservedDroneIds: ReadonlySet<string>,
): DispatchDroneCandidate[] {
  return drones.filter((drone) => isAssignableDrone(drone, reservedDroneIds));
}

/** Closest assignable drone distance; used to order competing critical targets. */
export function minAssignableDroneDistanceM(
  target: Pick<SelectDispatchSourceParams["target"], "lat" | "lon">,
  assignable: readonly DispatchDroneCandidate[],
): number {
  if (assignable.length === 0) {
    return Number.POSITIVE_INFINITY;
  }

  let closestDistanceM = Number.POSITIVE_INFINITY;

  for (const drone of assignable) {
    closestDistanceM = Math.min(
      closestDistanceM,
      distanceToTarget(drone, target),
    );
  }

  return closestDistanceM;
}

/**
 * Pick reuse, patrol, or airport spawn for one uncovered critical target.
 *
 * Priority: closest reusable drone (RTB / rejoin / idle dispatch) → idle patrol
 * only when closer than the nearest airport → spawn at nearest airport.
 */
export function selectDispatchSource({
  target,
  drones,
  reservedDroneIds,
  nextDispatchDroneId,
}: SelectDispatchSourceParams): DispatchAssignmentDecision {
  const assignable = filterAssignableDrones(drones, reservedDroneIds);

  const nearestAirport = findNearestAirport(target.lat, target.lon);
  const airportDistanceM = distanceM(
    nearestAirport.lon,
    nearestAirport.lat,
    target.lon,
    target.lat,
  );

  // Idle on-route patrol is handled below: assign only when closer than spawning at the nearest airport.
  const reusablePool = assignable.filter((drone) => !isIdleOnPatrolRoute(drone));
  const closestReusable = pickClosestDrone(reusablePool, target);

  if (closestReusable) {
    return {
      type: "reuse",
      droneId: closestReusable.droneId,
      homeAirportIdent: closestReusable.homeAirportIdent ?? null,
    };
  }

  const idlePatrol = assignable.find(
    (drone) =>
      isIdleOnPatrolRoute(drone) && drone.droneId === PATROL_ASSET_ID,
  );

  if (idlePatrol) {
    const patrolDistanceM = distanceToTarget(idlePatrol, target);

    if (patrolDistanceM <= airportDistanceM) {
      return { type: "patrol", droneId: idlePatrol.droneId };
    }
  }

  return {
    type: "spawn",
    droneId: nextDispatchDroneId,
    homeAirportIdent: nearestAirport.ident,
    spawnLat: nearestAirport.lat,
    spawnLon: nearestAirport.lon,
  };
}
