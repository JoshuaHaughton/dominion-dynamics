import type { NextFunction, Request, RequestHandler, Response } from "express";
import type { ZodType } from "zod";

type RequestPart = "body" | "params" | "query";

type ValidateRequestSchemas = Partial<Record<RequestPart, ZodType>>;

/** Validate selected req parts against shared Zod schemas before the controller runs. */
export function validateRequest(schemas: ValidateRequestSchemas): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    for (const part of ["params", "query", "body"] as const) {
      const schema = schemas[part];

      if (!schema) {
        continue;
      }

      const result = schema.safeParse(req[part]);

      if (!result.success) {
        res.status(400).json({ error: result.error.flatten() });
        return;
      }

      req[part] = result.data;
    }

    next();
  };
}
