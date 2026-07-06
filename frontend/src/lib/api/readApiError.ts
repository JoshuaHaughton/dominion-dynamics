import {
  ValidationErrorBodySchema,
  type ValidationErrorBody,
} from "@dominion-dynamics/shared";

/** Default Zod messages are for developers; show the caller fallback instead. */
const ZOD_DEFAULT_MESSAGE =
  /expected|received|Invalid input|String must contain|Array must contain/i;

function isUserSafeValidationMessage(message: string): boolean {
  return !ZOD_DEFAULT_MESSAGE.test(message);
}

function firstUserSafeValidationMessage(
  body: ValidationErrorBody,
): string | undefined {
  const formError = body.formErrors?.[0];

  if (formError && isUserSafeValidationMessage(formError)) {
    return formError;
  }

  for (const field of ["geojson", "name"] as const) {
    const message = body.fieldErrors?.[field]?.[0];

    if (message && isUserSafeValidationMessage(message)) {
      return message;
    }
  }

  if (body.fieldErrors) {
    for (const messages of Object.values(body.fieldErrors)) {
      const message = messages[0];

      if (message && isUserSafeValidationMessage(message)) {
        return message;
      }
    }
  }

  return undefined;
}

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
