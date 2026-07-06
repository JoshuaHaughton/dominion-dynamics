import type { Zone } from "@dominion-dynamics/shared";
import { ZoneListSchema, ZoneSchema } from "@dominion-dynamics/shared";
import { API_ORIGIN } from "../../config/env.js";
import { parseAndValidate } from "../parseAndValidate.js";
import { readApiError } from "../readApiError.js";

/** Load all persisted restricted zones from the API. */
export async function fetchZones(): Promise<Zone[]> {
  const response = await fetch(`${API_ORIGIN}/api/zones`);

  if (!response.ok) {
    throw new Error(await readApiError(response, "Failed to load zones"));
  }

  return parseAndValidate(ZoneListSchema, await response.json(), "zones response");
}

/** Persist a newly drawn restricted zone polygon. */
export async function createZone(input: {
  name: string;
  geojson: Zone["geojson"];
}): Promise<Zone> {
  const response = await fetch(`${API_ORIGIN}/api/zones`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(await readApiError(response, "Failed to save zone"));
  }

  return parseAndValidate(ZoneSchema, await response.json(), "zone response");
}
