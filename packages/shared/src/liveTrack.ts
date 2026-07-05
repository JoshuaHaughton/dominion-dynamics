/** History window aligned with the five-minute threat warning horizon. */
export const TRACK_HISTORY_WINDOW_SECONDS = 300;

/** Ring buffer size for a given sim tick interval. */
export function trackHistoryCapacity(tickMs: number): number {
  return Math.ceil(TRACK_HISTORY_WINDOW_SECONDS / (tickMs / 1000));
}
