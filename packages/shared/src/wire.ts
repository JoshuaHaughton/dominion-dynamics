import type { Asset } from "./asset.js";

/** Full asset snapshot emitted on WebSocket connect and every sim tick. */
export type SnapshotMessage = {
  type: "snapshot";
  ts: number;
  assets: Asset[];
};
