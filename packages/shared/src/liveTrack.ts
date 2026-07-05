/** History window aligned with the five-minute threat warning horizon. */
export const TRACK_HISTORY_WINDOW_SECONDS = 300;

/** Default sim tick interval (ms). Matches backend `DEFAULT_TICK_MS`. */
export const DEFAULT_SIM_TICK_MS = 1_000;

/** Ring buffer size for a given sim tick interval. */
export function trackHistoryCapacity(tickMs: number): number {
  return Math.ceil(TRACK_HISTORY_WINDOW_SECONDS / (tickMs / 1000));
}

/** Default ring capacity at {@link DEFAULT_SIM_TICK_MS}. */
export const DEFAULT_TRACK_HISTORY_CAPACITY =
  trackHistoryCapacity(DEFAULT_SIM_TICK_MS);
