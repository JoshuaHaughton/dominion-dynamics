import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "drizzle-kit";

const dbPath = path.join(process.cwd(), "data", "app.db");
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

export default defineConfig({
  dialect: "sqlite",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: dbPath,
  },
});
