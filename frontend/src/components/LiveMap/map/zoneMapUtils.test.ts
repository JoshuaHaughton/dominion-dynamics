import { describe, expect, it } from "vitest";
import { zonesToFeatureCollection } from "./zoneMapUtils.js";
import type { ZoneView } from "../hooks/useZones.js";

describe("zonesToFeatureCollection", () => {
  const savedZone: ZoneView = {
    id: 1,
    name: "Zone 1",
    geojson: {
      type: "Feature",
      properties: {},
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-75.8, 45.3],
            [-75.6, 45.3],
            [-75.6, 45.45],
            [-75.8, 45.45],
            [-75.8, 45.3],
          ],
        ],
      },
    },
  };

  it("returns an empty collection for no zones", () => {
    expect(zonesToFeatureCollection([])).toEqual({
      type: "FeatureCollection",
      features: [],
    });
  });

  it("maps saved and pending zones to polygon features", () => {
    const pendingZone: ZoneView = {
      clientId: "temp-1",
      name: "Zone 2",
      pending: true,
      geojson: savedZone.geojson,
    };

    const collection = zonesToFeatureCollection([savedZone, pendingZone]);

    expect(collection.features).toHaveLength(2);
    expect(collection.features[0]?.id).toBe(1);
    expect(collection.features[0]?.properties).toEqual({
      id: 1,
      name: "Zone 1",
      pending: false,
    });
    expect(collection.features[1]?.id).toBe("temp-1");
    expect(collection.features[1]?.properties?.pending).toBe(true);
  });
});
