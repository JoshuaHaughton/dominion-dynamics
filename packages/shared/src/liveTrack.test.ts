import { describe, expect, it } from "vitest";
import {
  DEFAULT_SIM_TICK_MS,
  DEFAULT_TRACK_HISTORY_CAPACITY,
  TRACK_HISTORY_WINDOW_SECONDS,
  trackHistoryCapacity,
} from "./liveTrack.js";

describe("trackHistoryCapacity", () => {
  it("matches one sample per second over the history window", () => {
    expect(trackHistoryCapacity(1000)).toBe(TRACK_HISTORY_WINDOW_SECONDS);
  });

  it("scales with faster sim ticks", () => {
    expect(trackHistoryCapacity(500)).toBe(TRACK_HISTORY_WINDOW_SECONDS * 2);
  });
});

describe("DEFAULT_TRACK_HISTORY_CAPACITY", () => {
  it("matches capacity at the default sim tick interval", () => {
    expect(DEFAULT_TRACK_HISTORY_CAPACITY).toBe(
      trackHistoryCapacity(DEFAULT_SIM_TICK_MS),
    );
  });
});
