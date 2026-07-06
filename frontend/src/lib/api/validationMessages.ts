import type { ValidationErrorBody } from "@dominion-dynamics/shared";
import type { ZodError } from "zod";

/** Default Zod messages are for developers; show the caller fallback instead. */
const ZOD_DEFAULT_MESSAGE =
  /expected|received|Invalid input|String must contain|Array must contain/i;

export function isUserSafeValidationMessage(message: string): boolean {
  return !ZOD_DEFAULT_MESSAGE.test(message);
}

export function firstZodValidationMessage(error: ZodError): string | undefined {
  for (const issue of error.issues) {
    if (isUserSafeValidationMessage(issue.message)) {
      return issue.message;
    }
  }

  return undefined;
}

export function firstUserSafeValidationMessage(
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
