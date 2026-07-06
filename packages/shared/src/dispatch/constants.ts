/** How the operator drone entered the fight: saved route vs airport scramble. */
export type DroneOrigin = "patrol" | "dispatch";

/** Dispatch / reassignment lifecycle on the wire and in sim state. */
export type DispatchPhase =
  | "enroute"
  | "intercepting"
  | "trailing"
  | "rtb"
  | "at_base";

/** Legacy prefix; dispatch drone ids are now opaque UUIDs with monotonic SCRAM callsigns. */
export const DISPATCH_DRONE_ID_PREFIX = "dispatch-drone";
