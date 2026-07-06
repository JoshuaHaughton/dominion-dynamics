import { afterEach, describe, expect, it } from "vitest";
import { testAsset } from "@dominion-dynamics/shared/testing";
import {
  clearAssetTrackHistory,
  recordAssetTrackHistory,
} from "../sim/store/assetTrackHistory.js";
import { setAssets } from "../sim/store/store.js";
import {
  buildSelectedTrackDelta,
  getAssetTrackDetail,
} from "./buildAssetTrack.js";

describe("buildAssetTrack", () => {
  const asset = testAsset({ id: "track-1" });

  afterEach(() => {
    setAssets([]);
    clearAssetTrackHistory();
  });

  describe("getAssetTrackDetail", () => {
    it("returns null for ids not in the live store", () => {
      expect(getAssetTrackDetail("missing")).toBeNull();
    });

    it("returns history and a predicted path for a live asset", () => {
      setAssets([asset]);
      recordAssetTrackHistory([asset], 1000);
      recordAssetTrackHistory([{ ...asset, lat: asset.lat + 0.001 }], 2000);

      const detail = getAssetTrackDetail("track-1");

      expect(detail).not.toBeNull();
      expect(detail?.assetId).toBe("track-1");
      expect(detail?.history).toEqual([
        { lat: asset.lat, lon: asset.lon, ts: 1000 },
        { lat: asset.lat + 0.001, lon: asset.lon, ts: 2000 },
      ]);
      expect(detail?.predictedPath).toBeDefined();
    });
  });

  describe("buildSelectedTrackDelta", () => {
    it("returns only the latest history point", () => {
      setAssets([asset]);
      recordAssetTrackHistory([asset], 1000);
      recordAssetTrackHistory([{ ...asset, lat: asset.lat + 0.001 }], 2000);

      const delta = buildSelectedTrackDelta("track-1");

      expect(delta?.assetId).toBe("track-1");
      expect(delta?.point).toEqual({
        lat: asset.lat + 0.001,
        lon: asset.lon,
        ts: 2000,
      });
    });

    it("returns null when the asset has no recorded history", () => {
      setAssets([asset]);

      expect(buildSelectedTrackDelta("track-1")).toBeNull();
    });
  });
});
