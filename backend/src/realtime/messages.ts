import type { Asset } from "../sim/types.js";

/** Full fleet snapshot emitted on WebSocket connect and every sim tick. */
export type SnapshotMessage = {
  type: "snapshot";
  ts: number;
  assets: Asset[];
};

/** Build a snapshot payload from the current in-memory asset list. */
export function buildSnapshotMessage(assets: Asset[]): SnapshotMessage {
  return {
    type: "snapshot",
    ts: Date.now(),
    assets,
  };
}
