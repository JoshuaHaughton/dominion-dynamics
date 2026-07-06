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

/** POST /api/zones */
export function createZoneHandler(req: Request, res: Response): void {
  const body = req.body as CreateZoneRequest;
  const zone = createZone(body);

  republishLiveSnapshot();

  res.status(201).json(zone);
}

/** DELETE /api/zones/:id */
export function deleteZoneHandler(req: Request, res: Response): void {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: "Invalid zone id" });
    return;
  }

  const deleted = deleteZone(id);

  if (!deleted) {
    res.status(404).json({ error: "Zone not found" });
    return;
  }

  republishLiveSnapshot();

  res.status(204).send();
}
