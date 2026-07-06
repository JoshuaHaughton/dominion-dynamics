import { z } from "zod";
import type { Feature, LineString } from "geojson";
import { lonLatPairSchema } from "../lib/coordinates.js";

export type PathKind = "patrol" | "dispatch";

export type PathGeoJson = Feature<LineString>;

/** GeoJSON LineString Feature for a drone route (min two vertices). */
export const PathGeoJsonSchema: z.ZodType<PathGeoJson> = z
  .object({
    type: z.literal("Feature"),
    properties: z.record(z.string(), z.unknown()).optional(),
    geometry: z.object({
      type: z.literal("LineString"),
      coordinates: z
        .array(lonLatPairSchema)
        .min(2, "Patrol path needs at least two waypoints"),
    }),
  })
  .passthrough() as z.ZodType<PathGeoJson>;

export const PathKindSchema = z.enum(["patrol", "dispatch"]);

/** Persisted path row returned by repository helpers. */
export const PathRecordSchema = z.object({
  id: z.number().int().positive(),
  kind: PathKindSchema,
  label: z.string().nullable(),
  geojson: PathGeoJsonSchema,
  assignedDroneId: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

/** PUT /api/patrol-path request body. */
export const SavePatrolPathRequestSchema = z.object({
  geojson: PathGeoJsonSchema,
});

/** GET /api/patrol-path response body. */
export const PatrolPathResponseSchema = z.object({
  geojson: PathGeoJsonSchema.nullable(),
});

/** PUT /api/patrol-path response body. */
export const PatrolPathSchema = z.object({
  geojson: PathGeoJsonSchema,
});

export type PathRecord = z.infer<typeof PathRecordSchema>;
export type SavePatrolPathRequest = z.infer<typeof SavePatrolPathRequestSchema>;
export type PatrolPathResponse = z.infer<typeof PatrolPathResponseSchema>;
export type PatrolPath = z.infer<typeof PatrolPathSchema>;
