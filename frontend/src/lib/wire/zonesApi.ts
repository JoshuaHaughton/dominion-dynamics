import type { Zone } from "@dominion-dynamics/shared";
import { ZoneListSchema, ZoneSchema } from "@dominion-dynamics/shared";
import { API_ORIGIN } from "../config/env.js";
import { parseWire } from "./parseWire.js";

async function readApiError(
  response: Response,
  fallback: string,
): Promise<string> {
  try {
    const body: unknown = await response.json();

    if (isRecord(body) && typeof body.error === "string") {
      return body.error;
    }
  } catch {
    // Fall back to the generic message below.
  }

  return fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/** Load all persisted restricted zones from the API. */
export async function fetchZones(): Promise<Zone[]> {
  const response = await fetch(`${API_ORIGIN}/api/zones`);

  if (!response.ok) {
    throw new Error(await readApiError(response, "Failed to load zones"));
  }

  const body: unknown = await response.json();

  return parseWire(ZoneListSchema, body, "zones response");
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

  const body: unknown = await response.json();

  return parseWire(ZoneSchema, body, "zone response");
}
