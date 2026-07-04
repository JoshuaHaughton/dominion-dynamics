export type AssetSource = "opensky" | "synthetic";

export type ThreatLevel = "normal" | "warning" | "critical";

/**
 * Placeholder threat fields on sim/ingest assets before zone evaluation runs.
 * The server overwrites these on every live snapshot.
 */
export const UNEVALUATED_THREAT: Pick<Asset, "threat" | "tteSeconds"> = {
  threat: "normal",
  tteSeconds: null,
};

/** Live asset position broadcast to clients and used by the threat engine. */
export type Asset = {
  id: string;
  lat: number;
  lon: number;
  /** Meters above sea level. */
  alt: number;
  /** Degrees clockwise from north. */
  heading: number;
  /** Meters per second. */
  speed: number;
  source: AssetSource;
  /** Server-computed restricted-zone threat; clients render symbology from this. */
  threat: ThreatLevel;
  /**
   * Seconds until the nearest zone entry along the current heading.
   * Zero when critical (already inside). Null when not closing on a zone in time.
   */
  tteSeconds: number | null;
};

/** Geographic rectangle for sim seed regions or OpenSky query bboxes. */
export type SimBounds = {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
};
