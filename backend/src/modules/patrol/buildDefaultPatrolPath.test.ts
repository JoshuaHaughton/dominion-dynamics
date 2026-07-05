import { describe, expect, it } from "vitest";
import { buildDefaultPatrolPath } from "./buildDefaultPatrolPath.js";
import { SIM_SEED_REGION } from "../sim/config.js";

describe("buildDefaultPatrolPath", () => {
  it("builds a closed loop inside the seed region", () => {
    const path = buildDefaultPatrolPath(SIM_SEED_REGION);
    const coordinates = path.geometry.coordinates;

    expect(path.type).toBe("Feature");
    expect(path.geometry.type).toBe("LineString");
    expect(coordinates.length).toBeGreaterThanOrEqual(2);

    for (const [lon, lat] of coordinates) {
      expect(lon).toBeGreaterThanOrEqual(SIM_SEED_REGION.minLon);
      expect(lon).toBeLessThanOrEqual(SIM_SEED_REGION.maxLon);
      expect(lat).toBeGreaterThanOrEqual(SIM_SEED_REGION.minLat);
      expect(lat).toBeLessThanOrEqual(SIM_SEED_REGION.maxLat);
    }
  });
});
