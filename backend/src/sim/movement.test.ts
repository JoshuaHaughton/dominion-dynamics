import { describe, expect, it } from "vitest";
import { stepAsset } from "./movement.js";
import type { Asset } from "@dominion-dynamics/shared";
import { UNEVALUATED_THREAT } from "@dominion-dynamics/shared";

describe("stepAsset", () => {
  const baseAsset: Asset = {
    id: "test-1",
    lat: 45.4,
    lon: -75.7,
    alt: 1000,
    heading: 0,
    speed: 250,
    source: "synthetic",
    ...UNEVALUATED_THREAT,
  };

  it("moves north along heading 0", () => {
    const next = stepAsset({ asset: baseAsset, deltaSeconds: 1 });

    expect(next.lat).toBeGreaterThan(baseAsset.lat);
    expect(next.lon).toBeCloseTo(baseAsset.lon, 4);
    expect(next.id).toBe(baseAsset.id);
    expect(next.heading).toBe(baseAsset.heading);
  });

  it("moves east along heading 90", () => {
    const asset = { ...baseAsset, heading: 90 };
    const next = stepAsset({ asset, deltaSeconds: 1 });

    expect(next.lon).toBeGreaterThan(asset.lon);
    expect(next.lat).toBeCloseTo(asset.lat, 4);
  });

  it("scales distance with delta time", () => {
    const oneSecond = stepAsset({ asset: baseAsset, deltaSeconds: 1 });
    const twoSeconds = stepAsset({ asset: baseAsset, deltaSeconds: 2 });

    const oneSecondDelta = oneSecond.lat - baseAsset.lat;
    const twoSecondDelta = twoSeconds.lat - baseAsset.lat;

    expect(twoSecondDelta).toBeCloseTo(oneSecondDelta * 2, 5);
  });
});
