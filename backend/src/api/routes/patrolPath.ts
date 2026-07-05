import { Router } from "express";
import { SavePatrolPathRequestSchema } from "@dominion-dynamics/shared";
import {
  getPatrolPathHandler,
  savePatrolPathHandler,
} from "../controllers/patrolPathController.js";
import { validateRequest } from "../middleware/validateRequest.js";

export const patrolPathRouter = Router();

patrolPathRouter.get("/", getPatrolPathHandler);
patrolPathRouter.put(
  "/",
  validateRequest({ body: SavePatrolPathRequestSchema }),
  savePatrolPathHandler,
);
