import { z } from "zod";
import type { ValidationErrorBody } from "@dominion-dynamics/shared";

/** Drop empty field keys Zod flatten may type as undefined. */
function normalizeFieldErrors(
  fieldErrors: Record<string, string[] | undefined>,
): ValidationErrorBody["fieldErrors"] {
  const entries = Object.entries(fieldErrors).filter(
    (entry): entry is [string, string[]] => entry[1] !== undefined,
  );

  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

/** Shape a Zod failure for `{ error, fieldErrors, formErrors }` API responses. */
export function formatValidationError(error: z.ZodError): ValidationErrorBody {
  const { fieldErrors, formErrors } = error.flatten();

  return {
    error: "Validation failed",
    fieldErrors: normalizeFieldErrors(fieldErrors),
    formErrors,
  };
}
