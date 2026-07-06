import { describe, expect, it, vi } from "vitest";
import type { Map as MapLibreMap } from "maplibre-gl";
import type { AssetTrackDetail } from "@dominion-dynamics/shared";
import type { FeatureCollection, LineString } from "geojson";
import { MAP_LAYERS } from "../../../lib/constants/mapConstants.js";
import {
  clearAssetTrackLayers,
  updateAssetTrackLayerData,
} from "./assetTrackMapUtils.js";

describe("assetTrackMapUtils", () => {
  /** Fake map exposing per-source setData spies through the geojson guard. */
  function createFakeMap() {
    const setDataBySource = new Map<
      string,
      ReturnType<typeof vi.fn<(data: FeatureCollection<LineString>) => void>>
    >();

    const map = {
      getSource: (id: string) => {
        let setData = setDataBySource.get(id);

        if (!setData) {
          setData = vi.fn();
          setDataBySource.set(id, setData);
        }

        return { type: "geojson", setData };
      },
    } as unknown as MapLibreMap;

    return {
      map,
      historyData: () =>
        setDataBySource.get(MAP_LAYERS.assetHistorySource)?.mock.lastCall?.[0],
      predictionData: () =>
        setDataBySource.get(MAP_LAYERS.assetPredictionSource)?.mock
          .lastCall?.[0],
    };
  }

  const detail: AssetTrackDetail = {
    assetId: "track-1",
    history: [
      { lat: 45.4, lon: -75.7, ts: 1000 },
      { lat: 45.41, lon: -75.69, ts: 2000 },
    ],
    predictedPath: {
      type: "LineString",
      coordinates: [
        [-75.69, 45.41],
        [-75.65, 45.45],
      ],
    },
  };

  it("pushes a history line and a threat-tagged prediction line", () => {
    const fake = createFakeMap();

    updateAssetTrackLayerData(fake.map, detail, "warning");

    expect(fake.historyData()?.features[0]?.geometry.coordinates).toEqual([
      [-75.7, 45.4],
      [-75.69, 45.41],
    ]);
    expect(fake.predictionData()?.features[0]).toMatchObject({
      properties: { assetId: "track-1", threat: "warning" },
      geometry: {
        coordinates: [
          [-75.69, 45.41],
          [-75.65, 45.45],
        ],
      },
    });
  });

  it("emits no history line until two points exist", () => {
    const fake = createFakeMap();

    updateAssetTrackLayerData(fake.map, {
      ...detail,
      history: [{ lat: 45.4, lon: -75.7, ts: 1000 }],
    });

    expect(fake.historyData()?.features).toEqual([]);
  });

  it("suppresses degenerate predictions where start equals end", () => {
    const fake = createFakeMap();

    updateAssetTrackLayerData(fake.map, {
      ...detail,
      predictedPath: {
        type: "LineString",
        coordinates: [
          [-75.7, 45.4],
          [-75.7, 45.4],
        ],
      },
    });

    expect(fake.predictionData()?.features).toEqual([]);
  });

  it("clears both sources on deselect", () => {
    const fake = createFakeMap();

    updateAssetTrackLayerData(fake.map, detail, "critical");
    clearAssetTrackLayers(fake.map);

    expect(fake.historyData()?.features).toEqual([]);
    expect(fake.predictionData()?.features).toEqual([]);
  });
});
