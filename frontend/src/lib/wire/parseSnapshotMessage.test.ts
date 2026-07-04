import { describe, expect, it } from "vitest";
import { parseSnapshotMessage } from "./parseSnapshotMessage.js";

describe("parseSnapshotMessage", () => {
  it("accepts a valid snapshot payload", () => {
    const message = parseSnapshotMessage({
      type: "snapshot",
      ts: 123,
      assets: [],
    });

    expect(message).toEqual({ type: "snapshot", ts: 123, assets: [] });
  });

  it("rejects payloads with the wrong type", () => {
    expect(parseSnapshotMessage({ type: "event", ts: 1, assets: [] })).toBeNull();
  });

  it("rejects payloads missing assets", () => {
    expect(parseSnapshotMessage({ type: "snapshot", ts: 1 })).toBeNull();
  });

  it("rejects non-object payloads", () => {
    expect(parseSnapshotMessage("snapshot")).toBeNull();
    expect(parseSnapshotMessage(null)).toBeNull();
  });
});
