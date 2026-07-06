import { z } from "zod";
import type { Feature, Polygon } from "geojson";
import { lonLatPairSchema } from "../lib/coordinates.js";

function isClosedRing(ring: [number, number][]): boolean {
  const first = ring[0];
  const last = ring[ring.length - 1];

  if (ring.length < 4 || !first || !last) {
    return false;
  }

  return first[0] === last[0] && first[1] === last[1];
}

export type ZoneGeoJson = Feature<Polygon>;

/** Polygon Feature suitable for a restricted zone. */
export const ZoneGeoJsonSchema: z.ZodType<ZoneGeoJson> = z
  .object({
    type: z.literal("Feature"),
    properties: z.record(z.string(), z.unknown()).optional(),
    geometry: z.object({
      type: z.literal("Polygon"),
      coordinates: z.array(z.array(lonLatPairSchema)).min(1),
    }),
  })
  .passthrough()
  .superRefine((feature, context) => {
    if (feature.geometry.coordinates.length > 1) {
      context.addIssue({
        code: "custom",
        message: "Draw a simple polygon with one outer ring (no holes)",
      });
    }

    const outerRing = feature.geometry.coordinates[0];

    if (!outerRing || !isClosedRing(outerRing)) {
      context.addIssue({
        code: "custom",
        message: "Close the zone on the first point",
      });
    }
  }) as z.ZodType<ZoneGeoJson>;

/** POST /api/zones request body. */
export const CreateZoneRequestSchema = z
  .object({
    name: z.string().trim().min(1, "Zone name is required"),
    geojson: ZoneGeoJsonSchema,
  })
  .strict();

/** DELETE /api/zones/:id route params. */
export const ZoneIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

/** Persisted zone returned by the zones API. */
export const ZoneSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  geojson: ZoneGeoJsonSchema,
});

/** GET /api/zones response body. */
export const ZoneListSchema = z.array(ZoneSchema);

export type CreateZoneRequest = z.infer<typeof CreateZoneRequestSchema>;
export type Zone = z.infer<typeof ZoneSchema>;
