import { useEffect, useRef, useState } from "react";
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
  removeZone: (zoneId: number) => void;
  reportDrawError: (message: string) => void;
};

/**
 * Load persisted zones and optimistically add newly drawn polygons.
 * The load-on-mount shape intentionally mirrors usePatrolPath; with only two
 * resources a shared usePersistedResource abstraction isn't worth it.
 */
export function useZones(): UseZonesResult {
  const [zones, setZones] = useState<ZoneView[]>([]);
  const zonesRef = useRef(zones);
  const [error, setError] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  zonesRef.current = zones;

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

  function reportDrawError(message: string) {
    setError(message);
  }

  async function persistPendingZone(pendingZone: PendingZone) {
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
  }

  function addZoneFromDraw(geojson: ZoneGeoJson) {
    const validation = ZoneGeoJsonSchema.safeParse(geojson);

    if (!validation.success) {
      setError(firstZodValidationMessage(validation.error) ?? "Invalid zone");
      return;
    }

    setError(null);

    const pendingZone: PendingZone = {
      clientId: crypto.randomUUID(),
      name: nextZoneName(zonesRef.current.length),
      geojson,
      pending: true,
    };

    setZones((current) => [...current, pendingZone]);
    void persistPendingZone(pendingZone);
  }

  function removeZone(zoneId: number) {
    setError(null);

    const snapshot = zonesRef.current;
    const exists = snapshot.some(
      (zone) => !isPendingZone(zone) && zone.id === zoneId,
    );

    if (!exists) {
      return;
    }

    setZones(
      snapshot.filter((zone) => isPendingZone(zone) || zone.id !== zoneId),
    );

    void deleteZone(zoneId).catch((err: unknown) => {
      setZones(snapshot);
      setError(err instanceof Error ? err.message : "Failed to delete zone");
    });
  }

  return {
    zones,
    error,
    isLoaded,
    addZoneFromDraw,
    removeZone,
    reportDrawError,
  };
}
