import type { Request, Response } from "express";
import type { SavePatrolPathRequest } from "@dominion-dynamics/shared";
import { republishLiveSnapshot } from "../../modules/realtime/publishLiveSnapshot.js";
import { resetPatrolDrone } from "../../modules/patrol/patrolTick.js";
import {
  getPatrolPath,
  savePatrolPath,
} from "../../services/patrol/patrolPathService.js";

/** GET /api/patrol-path */
export function getPatrolPathHandler(_req: Request, res: Response): void {
  const patrolPath = getPatrolPath();

  if (!patrolPath) {
    res.status(404).json({ error: "Patrol path not found" });
    return;
  }

  res.json(patrolPath);
}

/** PUT /api/patrol-path */
export function savePatrolPathHandler(req: Request, res: Response): void {
  const body = req.body as SavePatrolPathRequest;
  const patrolPath = savePatrolPath(body);

  resetPatrolDrone();
  republishLiveSnapshot();

  res.json(patrolPath);
}
