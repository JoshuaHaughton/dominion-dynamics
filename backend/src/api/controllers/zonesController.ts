import type { Request, Response } from "express";
import type { CreateZoneRequest } from "@dominion-dynamics/shared";
import { republishLiveSnapshot } from "../../modules/realtime/publishLiveSnapshot.js";
import { createZone, listZones } from "../../services/zones/zoneService.js";

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
