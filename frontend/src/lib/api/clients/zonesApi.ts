import type { Zone } from "@dominion-dynamics/shared";
import { ZoneListSchema, ZoneSchema } from "@dominion-dynamics/shared";
import { apiFetch, apiMutate, jsonBodyInit } from "../httpClient.js";

/** Load all persisted restricted zones from the API. */
export async function fetchZones(): Promise<Zone[]> {
  return apiFetch("/api/zones", {
    schema: ZoneListSchema,
    label: "zones response",
    errorFallback: "Failed to load zones",
  });
}

/** Persist a newly drawn restricted zone polygon. */
export async function createZone(input: {
  name: string;
  geojson: Zone["geojson"];
}): Promise<Zone> {
  return apiFetch("/api/zones", {
    schema: ZoneSchema,
    label: "zone response",
    errorFallback: "Failed to save zone",
    init: jsonBodyInit("POST", input),
  });
}

/** Delete a persisted restricted zone. */
export async function deleteZone(zoneId: number): Promise<void> {
  await apiMutate(
    `/api/zones/${zoneId}`,
    { method: "DELETE" },
    "Failed to delete zone",
  );
}
