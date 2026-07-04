import { describe, expect, it } from "vitest";
import { parseSnapshotMessage } from "./parseSnapshotMessage.js";

const baseAsset = {
  id: "syn-1",
  lat: 45.4,
  lon: -75.7,
  alt: 1000,
  heading: 90,
  speed: 120,
  source: "synthetic" as const,
  threat: "normal" as const,
  tteSeconds: null,
};

describe("parseSnapshotMessage", () => {
  it("accepts a valid snapshot payload", () => {
    const message = parseSnapshotMessage({
      type: "snapshot",
      ts: 123,
      assets: [baseAsset],
    });

    expect(message).toEqual({ type: "snapshot", ts: 123, assets: [baseAsset] });
  });

  it("accepts warning assets with tteSeconds", () => {
    const message = parseSnapshotMessage({
      type: "snapshot",
      ts: 123,
      assets: [{ ...baseAsset, threat: "warning", tteSeconds: 45 }],
    });

    expect(message?.assets[0]?.threat).toBe("warning");
    expect(message?.assets[0]?.tteSeconds).toBe(45);
  });

  it("rejects payloads with the wrong type", () => {
    expect(parseSnapshotMessage({ type: "event", ts: 1, assets: [] })).toBeNull();
  });

  it("rejects payloads missing assets", () => {
    expect(parseSnapshotMessage({ type: "snapshot", ts: 1 })).toBeNull();
  });

  it("rejects assets missing threat fields", () => {
    const { threat: _threat, tteSeconds: _tte, ...legacyAsset } = baseAsset;

    expect(
      parseSnapshotMessage({
        type: "snapshot",
        ts: 1,
        assets: [legacyAsset],
      }),
    ).toBeNull();
  });

  it("rejects non-object payloads", () => {
    expect(parseSnapshotMessage("snapshot")).toBeNull();
    expect(parseSnapshotMessage(null)).toBeNull();
  });
});
