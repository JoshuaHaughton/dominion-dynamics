export type { Asset } from "./schemas/wire.js";

export type AssetSource = "opensky" | "synthetic";

export type ThreatLevel = "normal" | "warning" | "critical";

/** Geographic rectangle for sim seed regions or OpenSky query bboxes. */
export type SimBounds = {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
};
