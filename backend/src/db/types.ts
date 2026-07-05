import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema.js";

/** Shared Drizzle database handle for repositories and services. */
export type AppDatabase = BetterSQLite3Database<typeof schema>;
