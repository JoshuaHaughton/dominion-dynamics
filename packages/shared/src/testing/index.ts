/**
 * Shared test fixtures — import via `@dominion-dynamics/shared/testing`.
 * Not exported from the package root so production bundles never see them.
 */
import type {
  Asset,
  AssetZoneState,
  DispatchPhase,
  PatrolMode,
} from "../index.js";
import type { PathGeoJson } from "../patrol/path.js";
import type { ZoneGeoJson } from "../zone/schema.js";

export const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Stable UUIDs reused across dispatch/allocator tests. */
export const TEST_IDS = {
  DISPATCH_DRONE: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
  SECOND_DISPATCH_DRONE: "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22",
} as const;

/** Zone state for traffic that is nowhere near a restricted zone. */
const DEFAULT_TEST_ZONE: AssetZoneState = {
  threat: "normal",
  zoneTteSeconds: null,
  nearestBoundaryM: null,
};

/** Synthetic asset with Ottawa-area defaults. */
export function testAsset(overrides: Partial<Asset> = {}): Asset {
  return {
    id: "test-asset",
    lat: 45.4,
    lon: -75.7,
    alt: 1000,
    heading: 90,
    speed: 100,
    role: "traffic",
    category: 0,
    callsign: null,
    originCountry: null,
    onGround: false,
    zone: DEFAULT_TEST_ZONE,
    ...overrides,
  };
}

/** Traffic asset preset; pass a zone override to set the threat level. */
export function testTrafficAsset(overrides: Partial<Asset> = {}): Asset {
  return testAsset({
    id: "traffic-1",
    callsign: "UAL123",
    speed: 120,
    ...overrides,
  });
}

/** Patrol drone asset preset (wire shape). */
export function testPatrolDrone(
  overrides: Partial<Asset> = {},
  patrol: {
    mode: PatrolMode;
    shadowTargetId: string | null;
    pathId?: number;
  } = {
    mode: "patrol",
    shadowTargetId: null,
    pathId: 1,
  },
): Asset {
  return testAsset({
    id: "patrol-1",
    lat: 45.35,
    lon: -75.65,
    alt: 500,
    heading: 45,
    speed: 80,
    role: "drone",
    category: 14,
    zone: null,
    drone: { origin: "patrol", patrol },
    ...overrides,
  });
}

/** Dispatch drone asset preset (wire shape). */
export function testDispatchDrone(
  overrides: Partial<Asset> = {},
  dispatch: {
    targetId: string;
    phase: DispatchPhase;
    homeAirportIdent: string;
  } = { targetId: "traffic-1", phase: "trailing", homeAirportIdent: "CYOW" },
): Asset {
  return testAsset({
    id: "dispatch-1",
    lat: 45.36,
    lon: -75.66,
    alt: 500,
    heading: 45,
    speed: 200,
    role: "drone",
    category: 14,
    callsign: "Dispatch-1",
    zone: null,
    drone: { origin: "dispatch", dispatch },
    ...overrides,
  });
}

/**
 * Dispatch mission fixture. Typed structurally so backend tests can assign it
 * to `DispatchMission` without shared depending on backend types.
 */
export function testDispatchMission(
  overrides: Partial<{
    targetId: string;
    droneId: string;
    assignmentSource: "spawn" | "reuse" | "patrol";
    homeAirportIdent: string | null;
    assignedAtMs: number;
  }> = {},
): {
  targetId: string;
  droneId: string;
  assignmentSource: "spawn" | "reuse" | "patrol";
  homeAirportIdent: string | null;
  assignedAtMs: number;
} {
  return {
    targetId: "critical-1",
    droneId: TEST_IDS.DISPATCH_DRONE,
    assignmentSource: "spawn",
    homeAirportIdent: "CYOW",
    assignedAtMs: 1_700_000_000_000,
    ...overrides,
  };
}

/** The Ottawa rectangle used as the canonical valid zone polygon in tests. */
export function ottawaZonePolygon(): ZoneGeoJson {
  return {
    type: "Feature",
    properties: {},
    geometry: {
      type: "Polygon",
      coordinates: [
        [
          [-75.8, 45.3],
          [-75.6, 45.3],
          [-75.6, 45.45],
          [-75.8, 45.45],
          [-75.8, 45.3],
        ],
      ],
    },
  };
}

/** Canonical three-waypoint open patrol line over Ottawa. */
export function ottawaPatrolPathOpen(): PathGeoJson {
  return {
    type: "Feature",
    properties: {},
    geometry: {
      type: "LineString",
      coordinates: [
        [-75.8, 45.3],
        [-75.6, 45.35],
        [-75.5, 45.45],
      ],
    },
  };
}

/** Closed variant of {@link ottawaPatrolPathOpen} (first vertex repeated). */
export function ottawaPatrolPath(): PathGeoJson {
  return {
    type: "Feature",
    properties: {},
    geometry: {
      type: "LineString",
      coordinates: [
        [-75.8, 45.3],
        [-75.6, 45.35],
        [-75.5, 45.45],
        [-75.8, 45.3],
      ],
    },
  };
}
