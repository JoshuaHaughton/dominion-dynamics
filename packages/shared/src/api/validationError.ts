import { z } from "zod";

/** 400 validation response from {@link formatValidationError} on the backend. */
export const ValidationErrorBodySchema = z.object({
  error: z.string().optional(),
  fieldErrors: z.record(z.string(), z.array(z.string())).optional(),
  formErrors: z.array(z.string()).optional(),
});

export type ValidationErrorBody = z.infer<typeof ValidationErrorBodySchema>;
