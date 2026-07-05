import type { Request, Response } from "express";
import { getAssets } from "../../modules/sim/simControl.js";
import { publishLiveSnapshot } from "../../modules/realtime/publishLiveSnapshot.js";
import { createZone, listZones } from "../../services/zones/zoneService.js";
import { validateCreateZoneBody } from "../../services/zones/validateZoneGeojson.js";

/** GET /api/zones */
export function listZonesHandler(_req: Request, res: Response): void {
  res.json(listZones());
}

/** POST /api/zones */
export function createZoneHandler(req: Request, res: Response): void {
  const parsed = validateCreateZoneBody(req.body);

  if (!parsed.ok) {
    res.status(400).json({ error: parsed.error });
    return;
  }

  const zone = createZone(parsed.value);

  const positions = getAssets();
  publishLiveSnapshot(positions);

  res.status(201).json(zone);
}
