import type { Request, Response } from "express";
import { getAssetTrackDetail } from "../../modules/track/buildAssetTrack.js";

/** GET /api/assets/:id */
export function getAssetDetailHandler(
  req: Request<{ id: string }>,
  res: Response,
): void {
  const detail = getAssetTrackDetail(req.params.id);

  if (!detail) {
    res.status(404).json({ error: "Asset not found" });
    return;
  }

  res.json(detail);
}
