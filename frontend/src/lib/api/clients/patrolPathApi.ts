import type { PathGeoJson } from "@dominion-dynamics/shared";
import { PatrolPathResponseSchema } from "@dominion-dynamics/shared";
import { API_ORIGIN } from "../../config/env.js";
import { parseAndValidate } from "../parseAndValidate.js";
import { readApiError } from "../readApiError.js";

/** Load the persisted patrol route, or null when none is saved yet. */
export async function fetchPatrolPath(): Promise<PathGeoJson | null> {
  const response = await fetch(`${API_ORIGIN}/api/patrol-path`);

  if (!response.ok) {
    throw new Error(await readApiError(response, "Failed to load patrol path"));
  }

  const { geojson } = parseAndValidate(
    PatrolPathResponseSchema,
    await response.json(),
    "patrol path response",
  );

  return geojson;
}

/** Save or replace the patrol route. */
export async function savePatrolPath(input: {
  geojson: PathGeoJson;
}): Promise<void> {
  const response = await fetch(`${API_ORIGIN}/api/patrol-path`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(await readApiError(response, "Failed to save patrol path"));
  }
}
