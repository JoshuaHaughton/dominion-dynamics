import { describe, expect, it } from "vitest";
import { SavePatrolPathRequestSchema } from "@dominion-dynamics/shared";
import { firstZodValidationMessage } from "./validationMessages.js";

describe("firstZodValidationMessage", () => {
  it("returns a custom schema message from a failed parse", () => {
    const result = SavePatrolPathRequestSchema.safeParse({
      geojson: {
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
          coordinates: [[-75.8, 45.3]],
        },
      },
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(firstZodValidationMessage(result.error)).toBe(
        "Patrol path needs at least two waypoints",
      );
    }
  });
});
