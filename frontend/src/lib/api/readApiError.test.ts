import { describe, expect, it } from "vitest";
import { readApiError } from "./readApiError.js";

describe("readApiError", () => {
  function jsonResponse(status: number, body: unknown): Response {
    return new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  }

  it("returns a custom validation message on 400", async () => {
    const message = await readApiError(
      jsonResponse(400, {
        error: "Validation failed",
        fieldErrors: {
          geojson: ["Patrol path needs at least two waypoints"],
        },
        formErrors: [],
      }),
      "Failed to save patrol path",
    );

    expect(message).toBe("Patrol path needs at least two waypoints");
  });

  it("falls back when validation messages look like raw Zod output", async () => {
    const message = await readApiError(
      jsonResponse(400, {
        error: "Validation failed",
        fieldErrors: {
          geojson: ["Array must contain at least 2 element(s)"],
        },
        formErrors: [],
      }),
      "Failed to save patrol path",
    );

    expect(message).toBe("Failed to save patrol path");
  });

  it("returns the caller fallback on non-validation errors", async () => {
    const message = await readApiError(
      jsonResponse(404, { error: "Asset not found" }),
      "Failed to load asset",
    );

    expect(message).toBe("Failed to load asset");
  });
});
