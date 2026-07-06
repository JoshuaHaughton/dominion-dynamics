import {
  ValidationErrorBodySchema,
} from "@dominion-dynamics/shared";
import { firstUserSafeValidationMessage } from "./validationMessages.js";

/**
 * Read a friendly message for failed API responses.
 * On 400 validation, prefer custom schema messages; otherwise use the fallback.
 * Logs the full body in dev for debugging.
 */
export async function readApiError(
  response: Response,
  fallback: string,
): Promise<string> {
  try {
    const body: unknown = await response.json();

    if (import.meta.env.DEV) {
      console.error("API error response", body);
    }

    if (response.status === 400) {
      const parsed = ValidationErrorBodySchema.safeParse(body);

      if (parsed.success) {
        return firstUserSafeValidationMessage(parsed.data) ?? fallback;
      }
    }
  } catch {
    // Response had no JSON body.
  }

  return fallback;
}
