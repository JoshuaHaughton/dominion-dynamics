import { useCallback, useEffect, useState } from "react";
import type { Zone, ZoneGeoJson } from "@dominion-dynamics/shared";
import { ZoneGeoJsonSchema } from "@dominion-dynamics/shared";
import {
  createZone,
  deleteZone,
  fetchZones,
} from "../../../lib/api/clients/zonesApi.js";
import { firstZodValidationMessage } from "../../../lib/api/validationMessages.js";

export type PendingZone = {
  clientId: string;
  name: string;
  geojson: ZoneGeoJson;
  pending: true;
};

export type SavedZoneView = Zone & { pending?: undefined };

export type ZoneView = SavedZoneView | PendingZone;

/** True while a drawn polygon is still waiting on the save request. */
export function isPendingZone(zone: ZoneView): zone is PendingZone {
  return zone.pending === true;
}

function nextZoneName(existingCount: number): string {
  return `Zone ${existingCount + 1}`;
}

export type UseZonesResult = {
  zones: ZoneView[];
  error: string | null;
  isLoaded: boolean;
  addZoneFromDraw: (geojson: ZoneGeoJson) => void;
  removeZone: (zoneId: number) => Promise<void>;
  reportDrawError: (message: string) => void;
};

/**
 * Load persisted zones and optimistically add newly drawn polygons.
 * The load-on-mount shape intentionally mirrors usePatrolPath; with only two
 * resources a shared usePersistedResource abstraction isn't worth it.
 */
export function useZones(): UseZonesResult {
  const [zones, setZones] = useState<ZoneView[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void fetchZones()
      .then((loaded) => {
        if (!cancelled) {
          setZones(loaded);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load zones");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoaded(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const reportDrawError = useCallback((message: string) => {
    setError(message);
  }, []);

  const persistPendingZone = useCallback(async (pendingZone: PendingZone) => {
    const { clientId, name, geojson } = pendingZone;

    try {
      const saved = await createZone({ name, geojson });

      setZones((current) =>
        current.map((zone) =>
          isPendingZone(zone) && zone.clientId === clientId ? saved : zone,
        ),
      );
    } catch (err: unknown) {
      setZones((current) =>
        current.filter(
          (zone) => !isPendingZone(zone) || zone.clientId !== clientId,
        ),
      );
      setError(err instanceof Error ? err.message : "Failed to save zone");
    }
  }, []);

  const addZoneFromDraw = useCallback(
    (geojson: ZoneGeoJson) => {
      // Validate before touching state; the generated name never fails
      // validation, so only the geometry needs checking here.
      const validation = ZoneGeoJsonSchema.safeParse(geojson);

      if (!validation.success) {
        setError(firstZodValidationMessage(validation.error) ?? "Invalid zone");
        return;
      }

      setError(null);

      setZones((current) => {
        const pendingZone: PendingZone = {
          clientId: crypto.randomUUID(),
          name: nextZoneName(current.length),
          geojson,
          pending: true,
        };

        void persistPendingZone(pendingZone);

        return [...current, pendingZone];
      });
    },
    [persistPendingZone],
  );

  const removeZone = useCallback(async (zoneId: number) => {
    setError(null);

    try {
      await deleteZone(zoneId);
      setZones((current) =>
        current.filter((zone) => isPendingZone(zone) || zone.id !== zoneId),
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete zone");
    }
  }, []);

  return {
    zones,
    error,
    isLoaded,
    addZoneFromDraw,
    removeZone,
    reportDrawError,
  };
}
