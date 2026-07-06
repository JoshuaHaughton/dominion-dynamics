import type { Request, Response } from "express";
import type { CreateZoneRequest } from "@dominion-dynamics/shared";
import { republishLiveSnapshot } from "../../modules/realtime/publishLiveSnapshot.js";
import {
  createZone,
  deleteZone,
  listZones,
} from "../../services/zones/zoneService.js";

/** GET /api/zones */
export function listZonesHandler(_req: Request, res: Response): void {
  res.json(listZones());
}

/** POST /api/zones — body validated by CreateZoneRequestSchema middleware. */
export function createZoneHandler(
  req: Request<Record<string, string>, unknown, CreateZoneRequest>,
  res: Response,
): void {
  const zone = createZone(req.body);

  republishLiveSnapshot();

  res.status(201).json(zone);
}

/** DELETE /api/zones/:id — params validated by ZoneIdParamSchema middleware. */
export function deleteZoneHandler(
  req: Request<{ id: string }>,
  res: Response,
): void {
  const id = Number(req.params.id);
  const deleted = deleteZone(id);

  if (!deleted) {
    res.status(404).json({ error: "Zone not found" });
    return;
  }

  republishLiveSnapshot();

  res.status(204).send();
}
