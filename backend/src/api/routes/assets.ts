import { Router } from "express";
import { AssetIdParamSchema } from "@dominion-dynamics/shared";
import { getAssetDetailHandler } from "../controllers/assetsController.js";
import { validateRequest } from "../middleware/validateRequest.js";

export const assetsRouter = Router();

assetsRouter.get(
  "/:id",
  validateRequest({ params: AssetIdParamSchema }),
  getAssetDetailHandler,
);
