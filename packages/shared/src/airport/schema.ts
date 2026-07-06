import { z } from "zod";

/** One airfield from the OurAirports registry (large / medium / small; no heliports). */
export const AirportSchema = z.object({
  ident: z.string().min(1),
  name: z.string().min(1),
  lat: z.number().finite().min(-90).max(90),
  lon: z.number().finite().min(-180).max(180),
});

export type Airport = z.infer<typeof AirportSchema>;
