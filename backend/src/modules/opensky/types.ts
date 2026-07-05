/** OpenSky /states/all row indices. See OpenSky REST API docs. */
export const OPEN_SKY_STATE_INDEX = {
  icao24: 0,
  callsign: 1,
  originCountry: 2,
  timePosition: 3,
  lastContact: 4,
  longitude: 5,
  latitude: 6,
  baroAltitude: 7,
  onGround: 8,
  velocity: 9,
  trueTrack: 10,
  verticalRate: 11,
  sensors: 12,
  geoAltitude: 13,
  squawk: 14,
  spi: 15,
  positionSource: 16,
  category: 17,
} as const;

/** Raw state vector row returned by OpenSky (nulls allowed on sparse fields). */
export type OpenSkyStateVector = [
  string,
  string | null,
  string,
  number | null,
  number,
  number | null,
  number | null,
  number | null,
  boolean,
  number | null,
  number | null,
  number | null,
  number[] | null,
  number | null,
  string | null,
  boolean,
  number,
  number,
];

export type OpenSkyStatesResponse = {
  time: number;
  states: OpenSkyStateVector[] | null;
};
