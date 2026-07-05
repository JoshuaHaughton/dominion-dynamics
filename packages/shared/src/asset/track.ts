import { z } from "zod";

/** GET /api/assets/:id route params. */
export const AssetIdParamSchema = z.object({
  id: z.string().min(1),
});

export const AssetHistoryPointSchema = z.object({
  lat: z.number().finite(),
  lon: z.number().finite(),
  ts: z.number().finite(),
});

export const PredictedPathLineSchema = z.object({
  type: z.literal("LineString"),
  coordinates: z.array(z.tuple([z.number().finite(), z.number().finite()])).min(2),
});

/** History and prediction for one asset (REST or snapshot selectedTrack). */
export const AssetTrackDetailSchema = z.object({
  assetId: z.string().min(1),
  history: z.array(AssetHistoryPointSchema),
  predictedPath: PredictedPathLineSchema,
});

/** Incremental track update after the client has received a full selectedTrack. */
export const SelectedTrackDeltaSchema = z.object({
  assetId: z.string().min(1),
  point: AssetHistoryPointSchema,
  predictedPath: PredictedPathLineSchema,
});

export type AssetHistoryPoint = z.infer<typeof AssetHistoryPointSchema>;
export type PredictedPathLine = z.infer<typeof PredictedPathLineSchema>;
export type AssetTrackDetail = z.infer<typeof AssetTrackDetailSchema>;
export type SelectedTrackDelta = z.infer<typeof SelectedTrackDeltaSchema>;
