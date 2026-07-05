import type { Request, Response } from "express";

/** GET /api/health */
export function getHealthHandler(_req: Request, res: Response): void {
  res.json({ ok: true });
}
