/**
 * Warning threshold from spec: TTE at or below this triggers warning symbology.
 * Track history capacity derives from the same five-minute horizon.
 */
export const THREAT_WARNING_WINDOW_SECONDS = 300;

/** Default sim tick interval (ms). Matches backend `DEFAULT_TICK_MS`. */
export const DEFAULT_SIM_TICK_MS = 1_000;

/** Ring buffer size for a given sim tick interval. */
export function trackHistoryCapacity(tickMs: number): number {
  return Math.ceil(THREAT_WARNING_WINDOW_SECONDS / (tickMs / 1000));
}

/** Default ring capacity at {@link DEFAULT_SIM_TICK_MS}. */
export const DEFAULT_TRACK_HISTORY_CAPACITY =
  trackHistoryCapacity(DEFAULT_SIM_TICK_MS);
