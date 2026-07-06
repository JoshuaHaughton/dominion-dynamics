import type { Request, Response } from "express";
import type { SavePatrolPathRequest } from "@dominion-dynamics/shared";
import { republishLiveSnapshot } from "../../modules/realtime/publishLiveSnapshot.js";
import { initializePatrolDrone } from "../../modules/patrol/tick/patrolTick.js";
import {
  resolvePatrolPath,
  savePatrolPath,
} from "../../services/patrol/patrolPathService.js";

/** GET /api/patrol-path */
export function getPatrolPathHandler(_req: Request, res: Response): void {
  const patrolPath = resolvePatrolPath();

  res.json({ geojson: patrolPath?.geojson ?? null });
}

/** PUT /api/patrol-path */
export function savePatrolPathHandler(
  req: Request<Record<string, string>, unknown, SavePatrolPathRequest>,
  res: Response,
): void {
  const patrolPath = savePatrolPath(req.body);

  initializePatrolDrone(patrolPath);
  republishLiveSnapshot();

  res.json({ geojson: patrolPath.geojson });
}
