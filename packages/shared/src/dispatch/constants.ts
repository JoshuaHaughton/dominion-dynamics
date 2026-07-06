import { z } from "zod";

/** How the operator drone entered the fight: saved route vs airport scramble. */
export const DroneOriginSchema = z.enum(["patrol", "dispatch"]);
export type DroneOrigin = z.infer<typeof DroneOriginSchema>;

/** Dispatch / reassignment lifecycle on the wire and in sim state. */
export const DispatchPhaseSchema = z.enum([
  "enroute",
  "intercepting",
  "trailing",
  "rtb",
  "at_base",
]);
export type DispatchPhase = z.infer<typeof DispatchPhaseSchema>;
