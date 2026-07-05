import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

/** Restricted zones. GeoJSON polygon stored as JSON text. */
export const zones = sqliteTable("zones", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  geojson: text("geojson").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

/** Persisted drone route geometry. */
export const paths = sqliteTable("paths", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  kind: text("kind").notNull(),
  label: text("label"),
  geojson: text("geojson").notNull(),
  assignedDroneId: text("assigned_drone_id"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});
