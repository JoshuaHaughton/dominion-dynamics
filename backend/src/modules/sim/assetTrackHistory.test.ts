import { describe, expect, it } from "vitest";
import {
  clearAssetTrackHistory,
  getAssetTrackHistory,
  recordAssetTrackHistory,
  TRACK_HISTORY_CAPACITY,
} from "./assetTrackHistory.js";
import { testAsset } from "../../testFixtures/asset.js";

const sampleAsset = testAsset({
  id: "a1",
  lat: 45.4,
  lon: -75.7,
  alt: 1000,
  heading: 90,
  speed: 100,
});

describe("assetTrackHistory", () => {
  it("stores chronological points per asset", () => {
    clearAssetTrackHistory();

    recordAssetTrackHistory([sampleAsset], 1000);
    recordAssetTrackHistory([{ ...sampleAsset, lat: 45.41 }], 2000);

    expect(getAssetTrackHistory("a1")).toEqual([
      { lat: 45.4, lon: -75.7, ts: 1000 },
      { lat: 45.41, lon: -75.7, ts: 2000 },
    ]);
  });

  it("drops the oldest point when capacity is exceeded", () => {
    clearAssetTrackHistory();

    for (let i = 0; i < TRACK_HISTORY_CAPACITY + 1; i += 1) {
      recordAssetTrackHistory([{ ...sampleAsset, lat: 45 + i * 0.001 }], i);
    }

    const history = getAssetTrackHistory("a1");

    expect(history).toHaveLength(TRACK_HISTORY_CAPACITY);
    expect(history[0]?.ts).toBe(1);
    expect(history.at(-1)?.ts).toBe(TRACK_HISTORY_CAPACITY);
  });

  it("removes history for asset ids no longer in the live snapshot", () => {
    clearAssetTrackHistory();

    recordAssetTrackHistory([sampleAsset], 1000);
    recordAssetTrackHistory(
      [testAsset({ id: "a2", lat: 45.5, lon: -75.8, alt: 1000, heading: 90, speed: 100 })],
      2000,
    );

    expect(getAssetTrackHistory("a1")).toEqual([]);
    expect(getAssetTrackHistory("a2")).toHaveLength(1);
  });
});
