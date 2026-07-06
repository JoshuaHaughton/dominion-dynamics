import type { Request, Response } from "express";
import type { SavePatrolPathRequest } from "@dominion-dynamics/shared";
import { republishLiveSnapshot } from "../../modules/realtime/publishLiveSnapshot.js";
import { initializePatrolDrone } from "../../modules/patrol/patrolTick.js";
import {
  getPatrolPath,
  savePatrolPath,
} from "../../services/patrol/patrolPathService.js";

/** GET /api/patrol-path */
export function getPatrolPathHandler(_req: Request, res: Response): void {
  const patrolPath = getPatrolPath();

  res.json({ geojson: patrolPath?.geojson ?? null });
}

/** PUT /api/patrol-path */
export function savePatrolPathHandler(req: Request, res: Response): void {
  const body = req.body as SavePatrolPathRequest;
  const patrolPath = savePatrolPath(body);

  initializePatrolDrone();
  republishLiveSnapshot();

  res.json(patrolPath);
}
