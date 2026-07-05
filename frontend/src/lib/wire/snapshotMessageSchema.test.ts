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
    zone: {
      threat: "normal" as const,
      tteSeconds: null,
      nearestBoundaryM: null,
    },
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

  it("accepts patrol assets with null zone state", () => {
    const message = SnapshotMessageSchema.parse({
      type: "snapshot",
      ts: 123,
      assets: [
        {
          ...baseAsset,
          id: "patrol-drone",
          role: "patrol" as const,
          zone: null,
          patrol: { mode: "patrol" as const, shadowTargetId: null },
        },
      ],
    });

    expect(message.assets[0]?.zone).toBeNull();
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

  it("accepts warning assets with nested zone state", () => {
    const message = SnapshotMessageSchema.parse({
      type: "snapshot",
      ts: 123,
      assets: [
        {
          ...baseAsset,
          zone: {
            threat: "warning" as const,
            tteSeconds: 45,
            nearestBoundaryM: 1200,
          },
        },
      ],
    });

    expect(message.assets[0]?.zone?.threat).toBe("warning");
    expect(message.assets[0]?.zone?.tteSeconds).toBe(45);
    expect(message.assets[0]?.zone?.nearestBoundaryM).toBe(1200);
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

  it("rejects assets missing zone state", () => {
    const { zone: _zone, ...legacyAsset } = baseAsset;

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
