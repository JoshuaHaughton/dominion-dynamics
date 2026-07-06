import { Router } from "express";
import {
  CreateZoneRequestSchema,
  ZoneIdParamSchema,
} from "@dominion-dynamics/shared";
import {
  createZoneHandler,
  deleteZoneHandler,
  listZonesHandler,
} from "../controllers/zonesController.js";
import { validateRequest } from "../middleware/validateRequest.js";

export const zonesRouter = Router();

zonesRouter.get("/", listZonesHandler);
zonesRouter.post(
  "/",
  validateRequest({ body: CreateZoneRequestSchema }),
  createZoneHandler,
);
zonesRouter.delete(
  "/:id",
  validateRequest({ params: ZoneIdParamSchema }),
  deleteZoneHandler,
);
