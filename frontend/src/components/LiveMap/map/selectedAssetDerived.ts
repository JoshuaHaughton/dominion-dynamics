import type { Asset, ThreatLevel } from "@dominion-dynamics/shared";

function threatForAsset(asset: Asset | undefined): ThreatLevel {
  return asset?.zone?.threat ?? "normal";
}

/** Selected asset threat as a primitive for effect deps (avoids keying on the full assets array). */
export function selectedAssetThreat(
  assets: readonly Asset[],
  selectedAssetId: string | null,
): ThreatLevel {
  if (selectedAssetId === null) {
    return "normal";
  }

  return threatForAsset(assets.find((asset) => asset.id === selectedAssetId));
}

/** Lat/lon key for effect deps — only changes when the selected asset moves. */
export function selectedAssetPositionKey(
  assets: readonly Asset[],
  selectedAssetId: string | null,
): string | null {
  if (selectedAssetId === null) {
    return null;
  }

  const asset = assets.find((candidate) => candidate.id === selectedAssetId);

  if (!asset) {
    return null;
  }

  return `${asset.lat},${asset.lon}`;
}

/** Lat/lon of the selected asset, or null when deselected / missing. */
export function selectedAssetPosition(
  assets: readonly Asset[],
  selectedAssetId: string | null,
): { lat: number; lon: number } | null {
  if (selectedAssetId === null) {
    return null;
  }

  const asset = assets.find((candidate) => candidate.id === selectedAssetId);

  if (!asset) {
    return null;
  }

  return { lat: asset.lat, lon: asset.lon };
}
