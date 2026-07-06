import type { NextFunction, Request, Response } from "express";

/**
 * Terminal error middleware: log the real error server-side, return a generic
 * body so stack traces and internals never reach clients.
 */
export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  // Express identifies error middleware by arity; the 4th param must exist.
  _next: NextFunction,
): void {
  console.error("Unhandled request error:", error);

  res.status(500).json({ error: "Internal server error" });
}
