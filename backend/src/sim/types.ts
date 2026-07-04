export type AssetSource = "opensky" | "synthetic";

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
};

/** Geographic rectangle — can be either the sim seed region or an OpenSky query bbox*/
export type SimBounds = {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
};
