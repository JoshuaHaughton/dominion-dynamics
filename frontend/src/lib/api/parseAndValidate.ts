import type { ZodType } from "zod";

/** Parse and validate an API JSON payload with a Zod schema; throw on invalid shapes. */
export function parseAndValidate<T>(
  schema: ZodType<T>,
  body: unknown,
  label: string,
): T {
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    throw new Error(`Invalid ${label}: ${parsed.error.message}`);
  }

  return parsed.data;
}
