import type { Zone, ZoneGeoJson } from "@dominion-dynamics/shared";
import { CreateZoneRequestSchema } from "@dominion-dynamics/shared";
import { useCallback, useEffect, useState } from "react";
import { createZone, fetchZones } from "../api/clients/zonesApi.js";
import { firstZodValidationMessage } from "../api/validationMessages.js";

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

/** Load persisted zones and optimistically add newly drawn polygons. */
export function useZones() {
  const [zones, setZones] = useState<ZoneView[]>([]);
  const [error, setError] = useState<string | null>(null);

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
          setError(
            err instanceof Error ? err.message : "Failed to load zones",
          );
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
      setError(null);
      let validationError: string | null = null;

      setZones((current) => {
        const name = nextZoneName(current.length);
        const validation = CreateZoneRequestSchema.safeParse({ name, geojson });

        if (!validation.success) {
          validationError =
            firstZodValidationMessage(validation.error) ?? "Invalid zone";
          return current;
        }

        const pendingZone: PendingZone = {
          clientId: crypto.randomUUID(),
          name,
          geojson,
          pending: true,
        };

        void persistPendingZone(pendingZone);

        return [...current, pendingZone];
      });

      if (validationError !== null) {
        setError(validationError);
      }
    },
    [persistPendingZone],
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return { zones, error, addZoneFromDraw, reportDrawError, clearError };
}
