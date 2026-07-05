import { z } from "zod";

/** GeoJSON position: `[longitude, latitude]`. */
export const lonLatPairSchema = z.tuple([
  z.number().finite().min(-180).max(180),
  z.number().finite().min(-90).max(90),
]);
