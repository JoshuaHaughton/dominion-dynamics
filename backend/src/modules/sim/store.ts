import type { Asset } from "@dominion-dynamics/shared";

/** In-memory Map of assets keyed by id. */
const assets = new Map<string, Asset>();

/** Upsert the latest live snapshot; drop ids that are no longer present. */
export function setAssets(next: readonly Asset[]): void {
  const nextIds = new Set(next.map((asset) => asset.id));

  for (const id of assets.keys()) {
    if (!nextIds.has(id)) {
      assets.delete(id);
    }
  }

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

/** Traffic assets from the sim store (excludes drones). */
export function getTrafficAssets(): Asset[] {
  const traffic: Asset[] = [];

  for (const asset of assets.values()) {
    if (!isDrone(asset)) {
      traffic.push(asset);
    }
  }

  return traffic;
}

/** Lookup one asset by id (undefined when missing or respawned). */
export function getAssetById(id: string): Asset | undefined {
  return assets.get(id);
}
