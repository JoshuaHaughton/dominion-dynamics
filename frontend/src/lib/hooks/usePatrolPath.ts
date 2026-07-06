import type { PathGeoJson } from "@dominion-dynamics/shared";
import { SavePatrolPathRequestSchema } from "@dominion-dynamics/shared";
import { useCallback, useEffect, useState } from "react";
import { fetchPatrolPath, savePatrolPath } from "../api/clients/patrolPathApi.js";
import { firstZodValidationMessage } from "../api/validationMessages.js";

/** Load the saved patrol route and persist newly drawn linestrings. */
export function usePatrolPath() {
  const [patrolPath, setPatrolPath] = useState<PathGeoJson | null>(null);
  const [isSaving, setIsSaving] = useState(false);
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
          firstZodValidationMessage(validation.error) ??
            "Invalid patrol path",
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

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    patrolPath,
    isSaving,
    error,
    addPatrolPathFromDraw,
    reportDrawError,
    clearError,
  };
}
