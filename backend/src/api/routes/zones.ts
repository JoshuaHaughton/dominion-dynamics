import { Router } from "express";
import {
  createZoneHandler,
  listZonesHandler,
} from "../controllers/zonesController.js";

export const zonesRouter = Router();

zonesRouter.get("/", listZonesHandler);
zonesRouter.post("/", createZoneHandler);
