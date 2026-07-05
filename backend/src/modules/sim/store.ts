import type { Asset } from "@dominion-dynamics/shared";

/** In-memory Map of assets keyed by id. */
const assets = new Map<string, Asset>();

/** Replace the full asset snapshot after seed or tick. */
export function setAssets(next: Asset[]): void {
  assets.clear();

  for (const asset of next) {
    assets.set(asset.id, asset);
  }
}

/** Shallow copy of all assets for broadcast or logging. */
export function getAssetList(): Asset[] {
  return [...assets.values()];
}

/** Traffic assets from the sim store (excludes the patrol drone). */
export function getTrafficAssets(): Asset[] {
  return getAssetList().filter((asset) => !isPatrolAsset(asset));
}

/** Lookup one asset by id (undefined when missing or respawned). */
export function getAssetById(id: string): Asset | undefined {
  return assets.get(id);
}

export function isPatrolAsset(asset: Asset): boolean {
  return asset.role === "patrol";
}
