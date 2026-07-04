import type { Asset } from "@dominion-dynamics/shared";
import { useLiveMap } from "./useLiveMap.js";

type LiveMapProps = {
  assets: readonly Asset[];
};

/** MapLibre map with live asset positions from WebSocket snapshots. */
export function LiveMap({ assets }: LiveMapProps) {
  const { containerRef } = useLiveMap(assets);

  return <div ref={containerRef} className="live-map" />;
}
