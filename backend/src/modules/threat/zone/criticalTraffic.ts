import type { Asset } from "@dominion-dynamics/shared";
import { isDrone } from "../../sim/store/store.js";

/** Traffic asset currently inside a restricted zone (drones never count). */
export function isCriticalTrafficAsset(asset: Asset): boolean {
  return !isDrone(asset) && asset.zone?.threat === "critical";
}
