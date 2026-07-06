import type { Asset, AssetDroneState } from "@dominion-dynamics/shared";

/** Merge drone sim fields onto the wire asset for WS snapshots. */
export function droneWireAsset(asset: Asset, drone: AssetDroneState): Asset {
  return {
    ...asset,
    role: "drone",
    zone: null,
    drone,
  };
}
