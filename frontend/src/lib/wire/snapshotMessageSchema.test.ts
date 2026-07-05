import { describe, expect, it } from "vitest";
import { SnapshotMessageSchema } from "@dominion-dynamics/shared";

describe("SnapshotMessageSchema", () => {
  const baseAsset = {
    id: "syn-1",
    lat: 45.4,
    lon: -75.7,
    alt: 1000,
    heading: 90,
    speed: 120,
    role: "traffic" as const,
    category: 0,
    callsign: null,
    originCountry: null,
    onGround: false,
    threat: "normal" as const,
    zoneTteSeconds: null,
    nearestZoneDistanceM: null,
  };

  const selectedTrack = {
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

  it("accepts a valid snapshot payload", () => {
    const message = SnapshotMessageSchema.parse({
      type: "snapshot",
      ts: 123,
      assets: [baseAsset],
    });

    expect(message).toEqual({ type: "snapshot", ts: 123, assets: [baseAsset] });
  });

  it("accepts snapshots with selectedTrackDelta for synced clients", () => {
    const message = SnapshotMessageSchema.parse({
      type: "snapshot",
      ts: 123,
      assets: [baseAsset],
      selectedTrackDelta: {
        assetId: "syn-1",
        point: { lat: 45.41, lon: -75.7, ts: 2000 },
        predictedPath: selectedTrack.predictedPath,
      },
    });

    expect(message.selectedTrackDelta?.point.lat).toBe(45.41);
  });

  it("accepts snapshots with selectedTrack for the connection's selected asset", () => {
    const message = SnapshotMessageSchema.parse({
      type: "snapshot",
      ts: 123,
      assets: [baseAsset],
      selectedTrack,
    });

    expect(message.selectedTrack).toEqual(selectedTrack);
  });

  it("accepts warning assets with zoneTteSeconds and nearest zone distance", () => {
    const message = SnapshotMessageSchema.parse({
      type: "snapshot",
      ts: 123,
      assets: [
        {
          ...baseAsset,
          threat: "warning",
          zoneTteSeconds: 45,
          nearestZoneDistanceM: 1200,
        },
      ],
    });

    expect(message.assets[0]?.threat).toBe("warning");
    expect(message.assets[0]?.zoneTteSeconds).toBe(45);
    expect(message.assets[0]?.nearestZoneDistanceM).toBe(1200);
  });

  it("rejects payloads with the wrong type", () => {
    expect(
      SnapshotMessageSchema.safeParse({ type: "event", ts: 1, assets: [] })
        .success,
    ).toBe(false);
  });

  it("rejects payloads missing assets", () => {
    expect(
      SnapshotMessageSchema.safeParse({ type: "snapshot", ts: 1 }).success,
    ).toBe(false);
  });

  it("rejects assets missing threat fields", () => {
    const {
      threat: _threat,
      zoneTteSeconds: _tte,
      nearestZoneDistanceM: _distance,
      ...legacyAsset
    } = baseAsset;

    expect(
      SnapshotMessageSchema.safeParse({
        type: "snapshot",
        ts: 1,
        assets: [legacyAsset],
      }).success,
    ).toBe(false);
  });

  it("rejects non-object payloads", () => {
    expect(SnapshotMessageSchema.safeParse("snapshot").success).toBe(false);
    expect(SnapshotMessageSchema.safeParse(null).success).toBe(false);
  });
});
