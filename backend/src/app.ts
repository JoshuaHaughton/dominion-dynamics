import cors from "cors";
import express, { type Express } from "express";
import { healthRouter } from "./api/routes/health.js";
import { zonesRouter } from "./api/routes/zones.js";
import { patrolPathRouter } from "./api/routes/patrolPath.js";
import { errorHandler } from "./api/middleware/errorHandler.js";

/** Express wiring only; process concerns (listen, sim, shutdown) live in server.ts. */
export function createApp(): Express {
  const app = express();

  app.use(
    cors({
      origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    }),
  );
  app.use(express.json());

  app.use("/api/health", healthRouter);
  app.use("/api/zones", zonesRouter);
  app.use("/api/patrol-path", patrolPathRouter);

  app.use(errorHandler);

  return app;
}
