import type { PathGeoJson } from "@dominion-dynamics/shared";
import {
  PatrolPathResponseSchema,
  PatrolPathSchema,
} from "@dominion-dynamics/shared";
import { apiFetch, jsonBodyInit } from "../httpClient.js";

/** Load the persisted patrol route, or null when none is saved yet. */
export async function fetchPatrolPath(): Promise<PathGeoJson | null> {
  const { geojson } = await apiFetch("/api/patrol-path", {
    schema: PatrolPathResponseSchema,
    label: "patrol path response",
    errorFallback: "Failed to load patrol path",
  });

  return geojson;
}

/** Save or replace the patrol route. */
export async function savePatrolPath(input: {
  geojson: PathGeoJson;
}): Promise<void> {
  await apiFetch("/api/patrol-path", {
    schema: PatrolPathSchema,
    label: "patrol path save response",
    errorFallback: "Failed to save patrol path",
    init: jsonBodyInit("PUT", input),
  });
}
