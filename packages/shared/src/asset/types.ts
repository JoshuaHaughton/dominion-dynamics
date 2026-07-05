/** Operational role of a live map asset. */
export type AssetRole = "traffic" | "patrol";

export type ThreatLevel = "normal" | "warning" | "critical";

/** Geographic rectangle for sim seed regions or OpenSky query bboxes. */
export type SimBounds = {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
};
