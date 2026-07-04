import cors from "cors";
import express from "express";
import "./db/index.js";
import { healthRouter } from "./routes/health.js";

const app = express();
const port = Number(process.env.PORT ?? 8000);

app.use(
  cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
  }),
);
app.use(express.json());

app.use("/api/health", healthRouter);

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
