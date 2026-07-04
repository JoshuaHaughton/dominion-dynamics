import type { SnapshotMessage } from "@dominion-dynamics/shared";

/** Validate and narrow a WebSocket payload to a snapshot message. */
export function parseSnapshotMessage(data: unknown): SnapshotMessage | null {
  if (typeof data !== "object" || data === null) {
    return null;
  }

  const message = data as Partial<SnapshotMessage>;

  if (message.type !== "snapshot" || !Array.isArray(message.assets)) {
    return null;
  }

  return message as SnapshotMessage;
}
