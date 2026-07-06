import Database from "better-sqlite3";
import {
  drizzle,
  type BetterSQLite3Database,
} from "drizzle-orm/better-sqlite3";
import * as schema from "../db/schema.js";

export type TestDb = {
  database: BetterSQLite3Database<typeof schema>;
  sqlite: Database.Database;
};

/** In-memory SQLite with the app schema; callers must close `sqlite` after use. */
export function createTestDb(): TestDb {
  const sqlite = new Database(":memory:");

  sqlite.exec(`
    CREATE TABLE zones (
      id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      name text NOT NULL,
      geojson text NOT NULL,
      created_at integer NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE paths (
      id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      kind text NOT NULL,
      label text,
      geojson text NOT NULL,
      assigned_drone_id text,
      created_at integer NOT NULL DEFAULT (unixepoch()),
      updated_at integer NOT NULL DEFAULT (unixepoch())
    );
  `);

  return {
    sqlite,
    database: drizzle(sqlite, { schema }),
  };
}
