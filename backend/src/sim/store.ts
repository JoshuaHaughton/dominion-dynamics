import type { Asset } from "./types.js";

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
