import { describe, expect, it } from "vitest";
import { AssetTrackDetailSchema } from "@dominion-dynamics/shared";

describe("AssetTrackDetailSchema", () => {
  const validDetail = {
    assetId: "syn-1",
    history: [{ lat: 45.4, lon: -75.7, ts: 1000 }],
    predictedPath: {
      type: "LineString" as const,
      coordinates: [
        [-75.7, 45.4],
        [-75.65, 45.4],
      ],
    },
  };

  it("accepts a valid asset detail payload", () => {
    expect(AssetTrackDetailSchema.parse(validDetail)).toEqual(validDetail);
  });

  it("rejects payloads with invalid history points", () => {
    expect(
      AssetTrackDetailSchema.safeParse({
        ...validDetail,
        history: [{ lat: 45.4, lon: "bad", ts: 1 }],
      }).success,
    ).toBe(false);
  });

  it("rejects payloads with invalid predicted paths", () => {
    expect(
      AssetTrackDetailSchema.safeParse({
        ...validDetail,
        predictedPath: { type: "LineString", coordinates: [[-75.7, 45.4]] },
      }).success,
    ).toBe(false);
  });
});
