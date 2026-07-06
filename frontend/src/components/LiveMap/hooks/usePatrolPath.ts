import type { PathGeoJson } from "@dominion-dynamics/shared";
import { SavePatrolPathRequestSchema } from "@dominion-dynamics/shared";
import { useCallback, useEffect, useState } from "react";
import {
  fetchPatrolPath,
  savePatrolPath,
} from "../../../lib/api/clients/patrolPathApi.js";
import { firstZodValidationMessage } from "../../../lib/api/validationMessages.js";

export type UsePatrolPathResult = {
  patrolPath: PathGeoJson | null;
  isSaving: boolean;
  isLoaded: boolean;
  error: string | null;
  addPatrolPathFromDraw: (geojson: PathGeoJson) => void;
  reportDrawError: (message: string) => void;
};

/** Load the saved patrol route and persist newly drawn linestrings. */
export function usePatrolPath(): UsePatrolPathResult {
  const [patrolPath, setPatrolPath] = useState<PathGeoJson | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void fetchPatrolPath()
      .then((loaded) => {
        if (!cancelled) {
          setPatrolPath(loaded);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load patrol path",
          );
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

  const persistPatrolPath = useCallback(
    async (geojson: PathGeoJson, previous: PathGeoJson | null) => {
      setIsSaving(true);

      try {
        await savePatrolPath({ geojson });
      } catch (err: unknown) {
        setPatrolPath(previous);
        setError(
          err instanceof Error ? err.message : "Failed to save patrol path",
        );
      } finally {
        setIsSaving(false);
      }
    },
    [],
  );

  const addPatrolPathFromDraw = useCallback(
    (geojson: PathGeoJson) => {
      const validation = SavePatrolPathRequestSchema.safeParse({ geojson });

      if (!validation.success) {
        setError(
          firstZodValidationMessage(validation.error) ?? "Invalid patrol path",
        );
        return;
      }

      setError(null);

      setPatrolPath((previous) => {
        void persistPatrolPath(geojson, previous);
        return geojson;
      });
    },
    [persistPatrolPath],
  );

  return {
    patrolPath,
    isSaving,
    isLoaded,
    error,
    addPatrolPathFromDraw,
    reportDrawError,
  };
}
