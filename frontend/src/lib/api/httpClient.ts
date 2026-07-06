import type { ZodType } from "zod";
import { API_ORIGIN } from "../config/env.js";
import { parseAndValidate } from "./parseAndValidate.js";
import { readApiError } from "./readApiError.js";

type ApiFetchOptions<T> = {
  schema: ZodType<T>;
  /** Human label for validation errors, e.g. "zones response". */
  label: string;
  /** User-facing message when the request fails. */
  errorFallback: string;
  init?: RequestInit;
};

const JSON_HEADERS = { "Content-Type": "application/json" };

/** Fetch a JSON endpoint, surface API errors, and validate the body. */
export async function apiFetch<T>(
  path: string,
  { schema, label, errorFallback, init }: ApiFetchOptions<T>,
): Promise<T> {
  const response = await fetch(`${API_ORIGIN}${path}`, init);

  if (!response.ok) {
    throw new Error(await readApiError(response, errorFallback));
  }

  return parseAndValidate(schema, await response.json(), label);
}

/** Fire a mutation whose response body we don't consume (e.g. DELETE → 204). */
export async function apiMutate(
  path: string,
  init: RequestInit,
  errorFallback: string,
): Promise<void> {
  const response = await fetch(`${API_ORIGIN}${path}`, init);

  if (!response.ok) {
    throw new Error(await readApiError(response, errorFallback));
  }
}

/** RequestInit for a JSON-body mutation. */
export function jsonBodyInit(
  method: "POST" | "PUT",
  body: unknown,
): RequestInit {
  return {
    method,
    headers: JSON_HEADERS,
    body: JSON.stringify(body),
  };
}
