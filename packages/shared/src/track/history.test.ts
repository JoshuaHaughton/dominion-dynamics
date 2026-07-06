import { describe, expect, it } from "vitest";
import {
  THREAT_WARNING_WINDOW_SECONDS,
  trackHistoryCapacity,
} from "./history.js";

describe("trackHistoryCapacity", () => {
  it("matches one sample per second over the history window", () => {
    expect(trackHistoryCapacity(1000)).toBe(THREAT_WARNING_WINDOW_SECONDS);
  });

  it("scales with faster sim ticks", () => {
    expect(trackHistoryCapacity(500)).toBe(THREAT_WARNING_WINDOW_SECONDS * 2);
  });
});
