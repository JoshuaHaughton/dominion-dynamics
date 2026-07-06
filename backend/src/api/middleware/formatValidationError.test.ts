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
      const formatted = formatValidationError(result.error);

      // Assert structure only; exact message copy belongs to zod, not us.
      expect(formatted.error).toBe("Validation failed");
      expect(formatted.formErrors).toEqual([]);
      expect(Object.keys(formatted.fieldErrors ?? {}).sort()).toEqual([
        "count",
        "name",
      ]);
      expect(formatted.fieldErrors?.name).toHaveLength(1);
      expect(formatted.fieldErrors?.count).toHaveLength(1);
    }
  });
});
