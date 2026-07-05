import { z } from "zod";

/** Client → server: follow one asset's history and predicted path. */
export const SelectAssetMessageSchema = z.object({
  type: z.literal("select_asset"),
  assetId: z.string().min(1),
});

/** Client → server: stop track overlay pushes for this connection. */
export const DeselectAssetMessageSchema = z.object({
  type: z.literal("deselect_asset"),
});

export const ClientLiveMessageSchema = z.discriminatedUnion("type", [
  SelectAssetMessageSchema,
  DeselectAssetMessageSchema,
]);

export type SelectAssetMessage = z.infer<typeof SelectAssetMessageSchema>;
export type DeselectAssetMessage = z.infer<typeof DeselectAssetMessageSchema>;
export type ClientLiveMessage = z.infer<typeof ClientLiveMessageSchema>;
