import { randomUUID } from "node:crypto";
import { PATROL_ASSET_ID } from "@dominion-dynamics/shared";
import { requireNearestAirport } from "../../airport/registry.js";
import { distanceM } from "../../../lib/geo/distanceAndHeading.js";
import type {
  DispatchAssignmentDecision,
  DispatchDroneCandidate,
} from "../types.js";

type SelectDispatchSourceParams = {
  target: { id: string; lat: number; lon: number };
  drones: readonly DispatchDroneCandidate[];
  reservedDroneIds: ReadonlySet<string>;
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

type DispatchSourceCandidate =
  | {
      kind: "reuse";
      distanceM: number;
      drone: DispatchDroneCandidate;
    }
  | {
      kind: "patrol";
      distanceM: number;
      drone: DispatchDroneCandidate;
    }
  | {
      kind: "spawn";
      distanceM: number;
      homeAirportIdent: string;
      spawnLat: number;
      spawnLon: number;
    };

function toAssignmentDecision(
  candidate: DispatchSourceCandidate,
): DispatchAssignmentDecision {
  if (candidate.kind === "reuse") {
    return {
      type: "reuse",
      droneId: candidate.drone.droneId,
      homeAirportIdent: candidate.drone.homeAirportIdent ?? null,
    };
  }

  if (candidate.kind === "patrol") {
    return { type: "patrol", droneId: candidate.drone.droneId };
  }

  return {
    type: "spawn",
    droneId: randomUUID(),
    homeAirportIdent: candidate.homeAirportIdent,
    spawnLat: candidate.spawnLat,
    spawnLon: candidate.spawnLon,
  };
}

/**
 * Pick reuse, patrol, or airport spawn for one uncovered critical target.
 *
 * Competing assignable sources race on distance to the target. Shadowing or
 * rejoining patrol drones are never candidates.
 */
export function selectDispatchSource({
  target,
  drones,
  reservedDroneIds,
}: SelectDispatchSourceParams): DispatchAssignmentDecision {
  const assignable = filterAssignableDrones(drones, reservedDroneIds);
  const nearestAirport = requireNearestAirport(target.lat, target.lon);
  const airportDistanceM = distanceM(
    nearestAirport.lon,
    nearestAirport.lat,
    target.lon,
    target.lat,
  );

  const candidates: DispatchSourceCandidate[] = [
    {
      kind: "spawn",
      distanceM: airportDistanceM,
      homeAirportIdent: nearestAirport.ident,
      spawnLat: nearestAirport.lat,
      spawnLon: nearestAirport.lon,
    },
  ];

  for (const drone of assignable) {
    if (isIdleOnPatrolRoute(drone) && drone.droneId === PATROL_ASSET_ID) {
      candidates.push({
        kind: "patrol",
        distanceM: distanceToTarget(drone, target),
        drone,
      });
      continue;
    }

    if (drone.origin !== "patrol") {
      candidates.push({
        kind: "reuse",
        distanceM: distanceToTarget(drone, target),
        drone,
      });
    }
  }

  const closest = candidates.reduce((best, candidate) =>
    candidate.distanceM < best.distanceM ? candidate : best,
  );

  return toAssignmentDecision(closest);
}
