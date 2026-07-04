import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

/** Restricted zones — GeoJSON polygon stored as JSON text (added in a later section). */
export const zones = sqliteTable("zones", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  geojson: text("geojson").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});
