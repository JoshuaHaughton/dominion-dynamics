import { describe, expect, it } from "vitest";
import { rayTteSeconds } from "./rayTte.js";
import { toCachedZone } from "./zoneGeometryCache.js";

describe("rayTteSeconds", () => {
  // ~1.56 km square centered on (45.40, -75.70).
  const zone = toCachedZone({
    id: 1,
    name: "Test zone",
    geojson: {
      type: "Feature",
      properties: {},
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-75.71, 45.39],
            [-75.69, 45.39],
            [-75.69, 45.41],
            [-75.71, 45.41],
            [-75.71, 45.39],
          ],
        ],
      },
    },
  });

  it("returns null for a stationary asset", () => {
    expect(
      rayTteSeconds({ lat: 45.42, lon: -75.7, heading: 180, speed: 0 }, zone),
    ).toBeNull();
  });

  it("returns distance-over-speed when heading straight at the boundary", () => {
    // 0.01° of latitude (~1,112 m) north of the zone's top edge, flying due south.
    const tte = rayTteSeconds(
      { lat: 45.42, lon: -75.7, heading: 180, speed: 100 },
      zone,
    );

    expect(tte).not.toBeNull();
    expect(tte!).toBeGreaterThan(10);
    expect(tte!).toBeLessThan(12);
  });

  it("returns null when flying away from the zone", () => {
    expect(
      rayTteSeconds({ lat: 45.42, lon: -75.7, heading: 0, speed: 100 }, zone),
    ).toBeNull();
  });

  it("returns null when the crossing lies beyond the warning window", () => {
    // Same geometry, but slow enough that entry would take >300 s.
    expect(
      rayTteSeconds({ lat: 45.42, lon: -75.7, heading: 180, speed: 3 }, zone),
    ).toBeNull();
  });

  it("ignores a grazing hit at the ray origin and reports the far edge", () => {
    // Start exactly on the northern boundary heading south: the origin hit is
    // discarded and the southern boundary (~2,224 m away) becomes the TTE.
    const tte = rayTteSeconds(
      { lat: 45.41, lon: -75.7, heading: 180, speed: 100 },
      zone,
    );

    expect(tte).not.toBeNull();
    expect(tte!).toBeGreaterThan(21);
    expect(tte!).toBeLessThan(23);
  });
});
