import type { Asset, SnapshotMessage, ThreatLevel } from "@dominion-dynamics/shared";

const THREAT_LEVELS: ReadonlySet<ThreatLevel> = new Set([
  "normal",
  "warning",
  "critical",
]);

function parseAsset(value: unknown): Asset | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const asset = value as Partial<Asset>;

  if (
    typeof asset.id !== "string" ||
    typeof asset.lat !== "number" ||
    typeof asset.lon !== "number" ||
    typeof asset.alt !== "number" ||
    typeof asset.heading !== "number" ||
    typeof asset.speed !== "number" ||
    (asset.source !== "opensky" && asset.source !== "synthetic") ||
    typeof asset.threat !== "string" ||
    !THREAT_LEVELS.has(asset.threat) ||
    (asset.tteSeconds !== null && typeof asset.tteSeconds !== "number")
  ) {
    return null;
  }

  return asset as Asset;
}

/** Validate and narrow a WebSocket payload to a snapshot message. */
export function parseSnapshotMessage(data: unknown): SnapshotMessage | null {
  if (typeof data !== "object" || data === null) {
    return null;
  }

  const message = data as Partial<SnapshotMessage>;

  if (message.type !== "snapshot" || !Array.isArray(message.assets)) {
    return null;
  }

  if (typeof message.ts !== "number") {
    return null;
  }

  const assets: Asset[] = [];

  for (const asset of message.assets) {
    const parsed = parseAsset(asset);

    if (!parsed) {
      return null;
    }

    assets.push(parsed);
  }

  return {
    type: "snapshot",
    ts: message.ts,
    assets,
  };
}
