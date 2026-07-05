import type { Asset, SnapshotMessage } from "@dominion-dynamics/shared";

/** Build a snapshot payload from the current in-memory asset list. */
export function buildSnapshotMessage(assets: Asset[]): SnapshotMessage {
  return {
    type: "snapshot",
    ts: Date.now(),
    assets,
  };
}
