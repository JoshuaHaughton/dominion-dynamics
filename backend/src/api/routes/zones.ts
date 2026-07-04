import { Router } from "express";
import { broadcastSnapshot } from "../../realtime/ws.server.js";
import { getAssetList, setAssets } from "../../sim/store.js";
import { enrichAssetsWithThreat } from "../../threat/evaluateAsset.js";
import { appendZoneToCache, getCachedZones } from "../../threat/zoneGeometryCache.js";
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
  appendZoneToCache(zone);

  const zones = getCachedZones();
  const positions = getAssetList();
  const assets = enrichAssetsWithThreat(positions, zones);

  setAssets(assets);
  // Threat eval runs on the sim tick; push now so colors update without waiting.
  broadcastSnapshot(assets);

  res.status(201).json(zone);
});
