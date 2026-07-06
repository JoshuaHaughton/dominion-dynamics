import { describe, expect, it } from "vitest";
import { z } from "zod";
import { formatValidationError } from "./formatValidationError.js";

describe("formatValidationError", () => {
  it("returns structured field and form errors", () => {
    const result = z
      .object({
        name: z.string().min(1),
        count: z.number(),
      })
      .safeParse({ name: "", count: "bad" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(formatValidationError(result.error)).toEqual({
        error: "Validation failed",
        fieldErrors: {
          name: ["String must contain at least 1 character(s)"],
          count: ["Expected number, received string"],
        },
        formErrors: [],
      });
    }
  });
});
