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

/** Operator drones on the live map (`role === "drone"`). */
export function isDrone(asset: Asset): boolean {
  return asset.role === "drone";
}

/** Drones currently in the sim store. */
export function getDrones(): Asset[] {
  return getAssetList().filter(isDrone);
}

/** Traffic assets from the sim store (excludes drones). */
export function getTrafficAssets(): Asset[] {
  return getAssetList().filter((asset) => !isDrone(asset));
}

/** Lookup one asset by id (undefined when missing or respawned). */
export function getAssetById(id: string): Asset | undefined {
  return assets.get(id);
}
