import { Router } from "express";
import { createZone, getZones } from "../../zones/zoneService.js";
import { validateCreateZoneBody } from "../../zones/validateZoneGeojson.js";

export const zonesRouter = Router();

zonesRouter.get("/", (_req, res) => {
  res.json(getZones());
});

zonesRouter.post("/", (req, res) => {
  const parsed = validateCreateZoneBody(req.body);

  if (!parsed.ok) {
    res.status(400).json({ error: parsed.error });
    return;
  }

  const zone = createZone(parsed.value);
  res.status(201).json(zone);
});
