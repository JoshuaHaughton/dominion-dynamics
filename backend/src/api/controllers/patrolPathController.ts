import type { Request, Response } from "express";
import type { SavePatrolPathRequest } from "@dominion-dynamics/shared";
import {
  getPatrolPath,
  savePatrolPath,
} from "../../services/patrol/patrolPathService.js";

/** GET /api/patrol-path */
export function getPatrolPathHandler(_req: Request, res: Response): void {
  res.json(getPatrolPath());
}

/** PUT /api/patrol-path */
export function savePatrolPathHandler(req: Request, res: Response): void {
  const body = req.body as SavePatrolPathRequest;
  const patrolPath = savePatrolPath(body);

  res.json(patrolPath);
}
