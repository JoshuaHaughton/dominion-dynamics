import { describe, expect, it } from "vitest";
import {
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
