import { describe, expect, it } from "vitest";
import { ValidationErrorBodySchema } from "./validationError.js";

describe("ValidationErrorBodySchema", () => {
  it("accepts flattened Zod validation errors", () => {
    expect(
      ValidationErrorBodySchema.safeParse({
        error: "Validation failed",
        fieldErrors: {
          geojson: ["Patrol path needs at least two waypoints"],
        },
        formErrors: [],
      }).success,
    ).toBe(true);
  });

  it("rejects fieldErrors with the wrong value type", () => {
    expect(
      ValidationErrorBodySchema.safeParse({
        fieldErrors: { geojson: "not an array" },
      }).success,
    ).toBe(false);
  });
});
